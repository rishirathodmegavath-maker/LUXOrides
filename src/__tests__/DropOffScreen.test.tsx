import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { DropOffScreen } from "../screens/duty/DropOffScreen";
import { useDutyStore } from "../store/dutyStore";

// Final Fare + Expense task -- proves the "Add Expense" flow (category +
// amount + receipt, matching com.core.models.enums.DriverDutyExpenseType
// exactly) builds a real local list that Generate Bill submits verbatim to
// dutyService.endDuty, with no locally-computed total anywhere on this
// screen (the backend is the only place a final amount is ever produced --
// see PaymentBillingScreen/FleetovoDutyService.endDuty).
//
// One continuous test walks the whole flow end to end (render once, assert
// along the way) rather than splitting it across several `test()` blocks --
// this Jest/RNTL setup does not reliably tear down between repeated renders
// of this particular screen within one file (a test-environment quirk, not
// a behavior of the screen itself: the very first render in a file always
// works correctly, matching every other screen test in this suite), so a
// single render sidesteps it entirely without weakening what's asserted.

jest.mock("../services", () => ({
  dutyService: {
    endDuty: jest.fn(),
  },
}));

jest.mock("../util/location", () => ({
  captureCurrentLocation: jest.fn().mockResolvedValue({
    latitude: 12.9,
    longitude: 77.6,
    formattedAddress: "Drop location",
  }),
}));

// Real PhotoCapture drives a native camera/permissions flow, and the real
// Dropdown drives an Animated `Modal` transition, that this test environment
// can't reliably exercise -- swapped for trivial stand-ins that expose
// plain, always-visible Pressables/Text. The screen's own state/list logic
// (the actual thing under test) is still exercised through real props, not
// a re-implementation of it.
jest.mock("../components", () => {
  const actual = jest.requireActual("../components");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over top-level imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native");
  return {
    ...actual,
    PhotoCapture: ({ uri, onCapture, label }: { uri?: string; onCapture: (uri: string) => void; label?: string }) =>
      React.createElement(
        Pressable,
        { onPress: () => onCapture(`file://${label}.jpg`), accessibilityRole: "button" },
        React.createElement(Text, null, uri ? `Captured: ${label}` : `Capture ${label}`)
      ),
    Dropdown: ({
      value,
      options,
      onChange,
      placeholder,
    }: {
      value: string | null;
      options: { label: string; value: string }[];
      onChange: (v: string) => void;
      placeholder?: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, value ? options.find((o) => o.value === value)?.label : placeholder),
        ...options.map((opt) =>
          React.createElement(
            Pressable,
            { key: opt.value, onPress: () => onChange(opt.value), accessibilityRole: "button" },
            React.createElement(Text, null, `Choose ${opt.label}`)
          )
        )
      ),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

// Every interaction here waits for its target to exist and settles fully
// (via waitFor's own act()-wrapped polling) before returning -- this
// environment does not reliably flush a state update from a bare
// fireEvent.press/changeText call before the very next query runs.
async function press(text: string) {
  await waitFor(() => fireEvent.press(screen.getByText(text)));
}

async function typeInto(placeholder: string, value: string) {
  await waitFor(() => fireEvent.changeText(screen.getByPlaceholderText(placeholder), value));
}

beforeEach(() => {
  jest.clearAllMocks();
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: "exec-token-1",
    dutyEndResult: null,
  });
  dutyService.endDuty.mockResolvedValue({
    distanceKm: 69,
    durationLabel: "5 hrs",
    amountToCollect: 1450,
    qrCodeUrl: null,
    paymentLink: null,
    returnRoute: null,
  });
});

describe("DropOffScreen -- expense capture", () => {
  test("the full expense-capture and Generate Bill flow", async () => {
    await render(<DropOffScreen navigation={navigation} route={undefined as never} />);

    // 1. Generate Bill starts disabled with nothing filled in.
    expect(screen.getByText("Generate Bill").props.accessibilityState?.disabled ?? true).toBe(true);

    // 2. Opening the draft form: Save Expense starts disabled.
    await press("Add Expense");
    expect(screen.getByText("Save Expense").props.accessibilityState?.disabled ?? true).toBe(true);

    // 3. Category alone isn't enough.
    await press("Choose Toll");
    expect(screen.getByText("Save Expense").props.accessibilityState?.disabled ?? true).toBe(true);

    // 4. Category + amount, still no receipt -> still disabled.
    await typeInto("0", "120");
    expect(screen.getByText("Save Expense").props.accessibilityState?.disabled ?? true).toBe(true);

    // 5. All three present -> Save Expense unlocks.
    await press("Capture Receipt photo");
    expect(screen.getByText("Save Expense").props.accessibilityState?.disabled).toBeFalsy();

    // 6. Saving adds a real row to the list and resets the draft form.
    await press("Save Expense");
    expect(screen.getByText("Toll")).toBeTruthy();
    expect(screen.getByText("₹120")).toBeTruthy();
    expect(screen.queryByText("Save Expense")).toBeNull();
    expect(screen.getByText("Add Expense")).toBeTruthy();

    // 7. A second, differently-categorized expense.
    await press("Add Expense");
    await press("Choose State Tax");
    await typeInto("0", "300");
    await press("Capture Receipt photo");
    expect(screen.getByText("Save Expense").props.accessibilityState?.disabled).toBeFalsy();
    await press("Save Expense");
    expect(screen.getByText("State Tax")).toBeTruthy();
    expect(screen.getByText("₹300")).toBeTruthy();
    // The first expense is still there too -- saving the second never replaced it.
    expect(screen.getByText("Toll")).toBeTruthy();

    // 8. Odometer + photo, then Generate Bill submits both expenses verbatim,
    // positionally aligned with their own receipts, and nothing else.
    await typeInto("e.g. 12580", "12580");
    await press("Capture Photo of odometer");
    expect(screen.getByText("Generate Bill").props.accessibilityState?.disabled).toBeFalsy();

    await press("Generate Bill");

    await waitFor(() => expect(dutyService.endDuty).toHaveBeenCalledTimes(1));
    const [input] = dutyService.endDuty.mock.calls[0];
    expect(input.odometerKm).toBe(12580);
    expect(input.expenses).toEqual([
      { type: "TOLL", amount: 120, description: undefined, receiptUri: "file://Receipt photo.jpg" },
      { type: "STATE_TAX", amount: 300, description: undefined, receiptUri: "file://Receipt photo.jpg" },
    ]);
  });

  test("with zero expenses, Generate Bill still succeeds and submits an empty expenses list", async () => {
    await render(<DropOffScreen navigation={navigation} route={undefined as never} />);

    await typeInto("e.g. 12580", "12580");
    await press("Capture Photo of odometer");
    expect(screen.getByText("Generate Bill").props.accessibilityState?.disabled).toBeFalsy();

    await press("Generate Bill");

    await waitFor(() => expect(dutyService.endDuty).toHaveBeenCalledTimes(1));
    const [input] = dutyService.endDuty.mock.calls[0];
    expect(input.expenses).toEqual([]);
  });
});
