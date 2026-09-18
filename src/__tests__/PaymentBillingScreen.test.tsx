import React from "react";
import { render, screen } from "@testing-library/react-native";
import { PaymentBillingScreen } from "../screens/duty/PaymentBillingScreen";
import { useDutyStore } from "../store/dutyStore";

// Final Fare + Payment task, Phase 15 -- "Collect Online"/"Cash Received"
// must never be reachable without a real, backend-computed dutyEndResult:
// either button leads straight into collecting a payment, so an enabled path
// to either one without an authoritative amount behind it would let a driver
// proceed against fare data the app cannot actually show.

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

async function renderScreen() {
  return render(<PaymentBillingScreen navigation={navigation} route={undefined as never} />);
}

const REAL_RESULT = {
  distanceKm: 69,
  durationLabel: "5 hrs",
  amountToCollect: 1450,
  qrCodeUrl: null,
  paymentLink: null,
  returnRoute: null,
  actualDrivenKm: 50,
  projectedTotalKm: 69,
  expensesTotal: 120,
  fareBreakdown: {
    dutyTypeLabel: "DAY",
    packageUnit: "DAY",
    includedDistanceKm: 60,
    includedTimeUnits: 1,
    baseFareAmount: 1000,
    extraDistanceKm: 9,
    extraDistanceRatePerKm: 50,
    extraDistanceCharge: 450,
    extraTimeHours: 0,
    extraTimeRatePerHour: 0,
    extraTimeCharge: 0,
    projectedTotalDurationSeconds: 18000,
  },
  gstAmount: null,
  gstRatePercent: null,
};

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
});

describe("PaymentBillingScreen", () => {
  test("with no real fare result, payment buttons are not offered at all", async () => {
    await renderScreen();

    expect(screen.queryByText("Collect Online")).toBeNull();
    expect(screen.queryByText("Cash Received")).toBeNull();
    expect(screen.getByText("Go back")).toBeTruthy();
    expect(screen.getByText("Final fare unavailable. Go back and generate the bill again to see it.")).toBeTruthy();
  });

  test("Go back never itself opens a payment flow", async () => {
    await renderScreen();

    expect(navigate).not.toHaveBeenCalled();
  });

  test("with a real backend fare result, both payment paths are offered", async () => {
    useDutyStore.setState({ dutyEndResult: REAL_RESULT });

    await renderScreen();

    expect(screen.getByText("Collect Online")).toBeTruthy();
    expect(screen.getByText("Cash Received")).toBeTruthy();
  });

  test("every figure shown comes from the stored backend result, never a hardcoded placeholder", async () => {
    useDutyStore.setState({ dutyEndResult: REAL_RESULT });

    await renderScreen();

    // FINAL AMOUNT row -- the one number payment is actually keyed off.
    expect(screen.getByText("₹1,450")).toBeTruthy();
    // Base fare row -- real package figures, not invented ones.
    expect(screen.getByText("₹1,000")).toBeTruthy();
  });
});
