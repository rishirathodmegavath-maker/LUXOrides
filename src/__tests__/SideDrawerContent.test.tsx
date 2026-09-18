import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { SideDrawerContent } from "../navigation/SideDrawerContent";
import { useDutyStore } from "../store/dutyStore";
import type { DutyEndResult } from "../services/types";

// Root-cause fix for "the QR code box in the side drawer is blank / looks
// removed": dutyEndResult is a one-shot snapshot from the moment the duty
// ended. Under the MOCK payment gateway (this org's actual configured
// gateway -- see MockPaymentService.generateMockQr) that snapshot's
// qrCodeUrl is always null because the payment is auto-confirmed
// server-side with no real QR to scan -- so the drawer must re-check real
// payment status and show "already paid", not linger on an empty QR box
// with a stale "please scan" prompt.

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over top-level imports
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

let mockDrawerStatus: "open" | "closed" = "open";
jest.mock("@react-navigation/drawer", () => ({
  useDrawerStatus: () => mockDrawerStatus,
}));

jest.mock("../services", () => ({
  dutyService: {
    checkPaymentStatus: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigation = { navigate: jest.fn() } as unknown as never;

function endResult(overrides: Partial<DutyEndResult> = {}): DutyEndResult {
  return {
    distanceKm: 10,
    durationLabel: "20 mins",
    amountToCollect: 1250,
    qrCodeUrl: null,
    paymentLink: null,
    returnRoute: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDrawerStatus = "open";
  useDutyStore.setState({ dutyEndResult: null, executionToken: null });
});

describe("SideDrawerContent QR payment panel", () => {
  test("shows nothing payment-related when no duty has just ended", async () => {
    await render(<SideDrawerContent navigation={navigation} state={undefined as never} descriptors={undefined as never} />);

    expect(screen.queryByText(/Ask the client to scan/)).toBeNull();
    expect(dutyService.checkPaymentStatus).not.toHaveBeenCalled();
  });

  test("a MOCK-gateway auto-confirmed payment (no real QR) shows as already paid, not a blank scan prompt", async () => {
    useDutyStore.setState({ dutyEndResult: endResult({ qrCodeUrl: null }), executionToken: "tok-1" });
    dutyService.checkPaymentStatus.mockResolvedValue({
      paid: true,
      status: "PAID",
      amount: 1250,
      qrImageUrl: null,
      message: "Dummy payment auto-confirmed (MOCK gateway) -- no real money collected",
    });

    await render(<SideDrawerContent navigation={navigation} state={undefined as never} descriptors={undefined as never} />);

    await waitFor(() => expect(screen.getByText(/already been paid for/)).toBeTruthy());
    expect(screen.queryByText(/Ask the client to scan/)).toBeNull();
    expect(screen.queryByText("Share QR Code")).toBeNull();
  });

  test("a real gateway QR still pending shows the real scan prompt with the real image", async () => {
    useDutyStore.setState({ dutyEndResult: endResult({ qrCodeUrl: null }), executionToken: "tok-2" });
    dutyService.checkPaymentStatus.mockResolvedValue({
      paid: false,
      status: "PENDING",
      amount: 1250,
      qrImageUrl: "https://razorpay.example/qr/real123.png",
      message: null,
    });

    await render(<SideDrawerContent navigation={navigation} state={undefined as never} descriptors={undefined as never} />);

    await waitFor(() => expect(screen.getByText(/Ask the client to scan/)).toBeTruthy());
  });

  test("does not re-check payment status while the drawer is closed", async () => {
    mockDrawerStatus = "closed";
    useDutyStore.setState({ dutyEndResult: endResult(), executionToken: "tok-3" });

    await render(<SideDrawerContent navigation={navigation} state={undefined as never} descriptors={undefined as never} />);

    expect(dutyService.checkPaymentStatus).not.toHaveBeenCalled();
  });
});
