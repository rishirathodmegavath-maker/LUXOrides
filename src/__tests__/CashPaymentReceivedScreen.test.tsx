import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { CashPaymentReceivedScreen } from "../screens/duty/CashPaymentReceivedScreen";
import { useDutyStore } from "../store/dutyStore";

// P0 revenue-integrity coverage (previously untested): "Cash Payment
// Received" must only ever unlock Continue once the real backend has
// confirmed the cash payment -- never from navigating to this screen, the
// icon/copy alone, or a transient failure. The driver must never be asked
// to type an amount; it always comes from the backend.

jest.mock("../services", () => ({
  dutyService: {
    confirmCashPayment: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

function setDutyEndResult(amountToCollect: number | undefined) {
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: "exec-token-1",
    dutyEndResult:
      amountToCollect != null
        ? { distanceKm: 10, durationLabel: "20 mins", amountToCollect, qrCodeUrl: null, paymentLink: null, returnRoute: null }
        : null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

describe("CashPaymentReceivedScreen", () => {
  test("Continue stays disabled while confirmation is in flight -- no ambiguous success on arrival", async () => {
    setDutyEndResult(1450);
    let resolveConfirm: (v: unknown) => void = () => {};
    dutyService.confirmCashPayment.mockReturnValue(new Promise((resolve) => (resolveConfirm = resolve)));

    await render(<CashPaymentReceivedScreen navigation={navigation} route={undefined as never} />);

    expect(screen.getByText("Confirming payment…")).toBeTruthy();
    const continueButton = screen.getByText("Continue");
    expect(continueButton.props.accessibilityState?.disabled ?? true).toBe(true);

    resolveConfirm({ confirmed: true, amount: 1450, message: "Cash payment recorded" });
    await waitFor(() => expect(screen.getByText("Cash Payment Received")).toBeTruthy());
  });

  test("only unlocks Continue once the backend genuinely confirms, and shows the backend's own amount", async () => {
    setDutyEndResult(1450);
    dutyService.confirmCashPayment.mockResolvedValue({ confirmed: true, amount: 1450, message: "Cash payment recorded" });

    await render(<CashPaymentReceivedScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Cash Payment Received")).toBeTruthy());
    expect(screen.getByText(/₹1,450/)).toBeTruthy();
    const continueButton = screen.getByText("Continue");
    expect(continueButton.props.accessibilityState?.disabled).toBeFalsy();

    await fireEvent.press(continueButton);
    expect(navigate).toHaveBeenCalledWith("DutyCompletionSlip");
  });

  test("the driver is never asked to type an amount -- there is no amount input anywhere on this screen", async () => {
    setDutyEndResult(1450);
    dutyService.confirmCashPayment.mockResolvedValue({ confirmed: true, amount: 1450, message: "Cash payment recorded" });

    await render(<CashPaymentReceivedScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => expect(screen.getByText("Cash Payment Received")).toBeTruthy());

    expect(screen.queryAllByRole("keyboardkey")).toHaveLength(0);
    expect(screen.queryByPlaceholderText(/amount/i)).toBeNull();
  });

  test("a rejected confirmation (network failure) never unlocks Continue and offers Retry, not silent failure", async () => {
    setDutyEndResult(1450);
    dutyService.confirmCashPayment.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<CashPaymentReceivedScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Couldn't confirm cash payment")).toBeTruthy());
    expect(Alert.alert).toHaveBeenCalledWith("Couldn't confirm cash payment", "Network request failed");
    const retryButton = screen.getByText("Retry");
    expect(retryButton.props.accessibilityState?.disabled).toBeFalsy();
    expect(screen.queryByText("Continue")).toBeNull();
  });

  test("a backend response that explicitly did not confirm is treated as failure, never as success", async () => {
    setDutyEndResult(1450);
    dutyService.confirmCashPayment.mockResolvedValueOnce({ confirmed: false, amount: 0, message: "Duty already closed" });

    await render(<CashPaymentReceivedScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Couldn't confirm cash payment")).toBeTruthy());
    expect(Alert.alert).toHaveBeenCalledWith("Couldn't confirm cash payment", "Duty already closed");
  });

  test("Retry re-attempts confirmation and can succeed after an initial failure", async () => {
    setDutyEndResult(1450);
    dutyService.confirmCashPayment.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<CashPaymentReceivedScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => expect(screen.getByText("Couldn't confirm cash payment")).toBeTruthy());

    dutyService.confirmCashPayment.mockResolvedValueOnce({ confirmed: true, amount: 1450, message: "Cash payment recorded" });
    await fireEvent.press(screen.getByText("Retry"));

    await waitFor(() => expect(screen.getByText("Cash Payment Received")).toBeTruthy());
    expect(dutyService.confirmCashPayment).toHaveBeenCalledTimes(2);
  });

  test("with no real duty-end result in the store, starts failed rather than confirming an invented amount", async () => {
    setDutyEndResult(undefined);

    await render(<CashPaymentReceivedScreen navigation={navigation} route={undefined as never} />);

    expect(screen.getByText("Couldn't confirm cash payment")).toBeTruthy();
    expect(dutyService.confirmCashPayment).not.toHaveBeenCalled();
  });
});
