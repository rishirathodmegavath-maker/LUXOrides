import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { PaymentQrScreen } from "../screens/duty/PaymentQrScreen";
import { useDutyStore } from "../store/dutyStore";

// P1 payment-integrity coverage: "Payment Received" must only ever unlock
// from a real backend-confirmed paid===true, never from the button press,
// QR display, elapsed time, or the socket merely being connected.

jest.mock("../services", () => ({
  dutyService: {
    checkPaymentStatus: jest.fn(),
  },
}));

let mockLatestOnPaid: (() => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock("../services/realtime/dutyPaymentSocket", () => ({
  subscribeToDutyPaymentUpdates: jest.fn((_token: string, onPaid: () => void) => {
    mockLatestOnPaid = onPaid;
    return mockUnsubscribe;
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

async function renderScreen() {
  return render(<PaymentQrScreen navigation={navigation} route={undefined as never} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLatestOnPaid = null;
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: "exec-token-1",
    dutyEndResult: { distanceKm: 10, durationLabel: "20 mins", amountToCollect: 500, qrCodeUrl: "https://qr.example/1", paymentLink: null, returnRoute: null },
  });
});

describe("PaymentQrScreen", () => {
  test("Payment Received is disabled while the backend has not confirmed payment", async () => {
    dutyService.checkPaymentStatus.mockResolvedValue({ paid: false, status: "PENDING", amount: 500, qrImageUrl: null });

    await renderScreen();

    await waitFor(() => expect(dutyService.checkPaymentStatus).toHaveBeenCalledTimes(1));

    const button = screen.getByText("Waiting for payment...");
    expect(button.props.accessibilityState?.disabled ?? true).toBe(true);
  });

  test("Payment Received unlocks once the initial status fetch already says paid", async () => {
    dutyService.checkPaymentStatus.mockResolvedValue({ paid: true, status: "PAID", amount: 500, qrImageUrl: null });

    await renderScreen();

    await waitFor(() => expect(screen.getByText("Payment Received")).toBeTruthy());
    const button = screen.getByText("Payment Received");
    expect(button.props.accessibilityState?.disabled).toBeFalsy();
  });

  test("a WebSocket push that confirms payment unlocks the button", async () => {
    dutyService.checkPaymentStatus.mockResolvedValue({ paid: false, status: "PENDING", amount: 500, qrImageUrl: null });

    await renderScreen();
    await waitFor(() => expect(dutyService.checkPaymentStatus).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Waiting for payment...")).toBeTruthy();

    dutyService.checkPaymentStatus.mockResolvedValue({ paid: true, status: "PAID", amount: 500, qrImageUrl: null });
    await act(async () => {
      mockLatestOnPaid?.();
    });

    await waitFor(() => expect(screen.getByText("Payment Received")).toBeTruthy());
  });

  test("a payment-status error is shown and never unlocks completion", async () => {
    dutyService.checkPaymentStatus.mockRejectedValue(new Error("Network request failed"));

    await renderScreen();

    await waitFor(() => expect(screen.getByText("Network request failed")).toBeTruthy());
    const button = screen.getByText("Waiting for payment...");
    expect(button.props.accessibilityState?.disabled ?? true).toBe(true);
  });

  test("tapping Payment Received navigates exactly once even under a rapid double-tap", async () => {
    dutyService.checkPaymentStatus.mockResolvedValue({ paid: true, status: "PAID", amount: 500, qrImageUrl: null });

    await renderScreen();
    await waitFor(() => expect(screen.getByText("Payment Received")).toBeTruthy());

    const button = screen.getByText("Payment Received");
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("DutyCompletionSlip");
  });
});
