import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { PickupOtpScreen } from "../screens/duty/PickupOtpScreen";

// Driver App audit priority coverage: the OTP is generated server-side and
// SMS'd to the customer the moment this screen mounts, and verified
// server-side only -- there is no client-side success condition (no
// hardcoded code) anywhere in this screen.

jest.mock("../services", () => ({
  dutyService: {
    requestPickupOtp: jest.fn(),
    verifyPickupOtp: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const navigation = { navigate } as unknown as never;

async function enterCode(code: string) {
  const input = screen.getByTestId("pickup-otp-code-input");
  await waitFor(() => fireEvent.changeText(input, code));
}

// The screen's own <Text> title reads "Verify & Start Ride" too (same
// string as the submit button's label) -- getByRole disambiguates by only
// matching the actual button.
function pressVerify() {
  fireEvent.press(screen.getByRole("button", { name: "Verify & Start Ride" }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("PickupOtpScreen", () => {
  test("requests a real OTP on mount -- no hardcoded/simulated code", async () => {
    dutyService.requestPickupOtp.mockResolvedValue(undefined);

    await render(<PickupOtpScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(dutyService.requestPickupOtp).toHaveBeenCalledTimes(1));
  });

  test("a correct code calls the real backend verification and starts the trip", async () => {
    dutyService.requestPickupOtp.mockResolvedValue(undefined);
    dutyService.verifyPickupOtp.mockResolvedValue(undefined);

    await render(<PickupOtpScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => expect(dutyService.requestPickupOtp).toHaveBeenCalledTimes(1));
    await enterCode("123456");
    await waitFor(() => pressVerify());

    await waitFor(() => expect(dutyService.verifyPickupOtp).toHaveBeenCalledWith("123456"));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("DropOffMap"));
  });

  test("a real backend rejection shows the server's own error and never starts the trip", async () => {
    dutyService.requestPickupOtp.mockResolvedValue(undefined);
    dutyService.verifyPickupOtp.mockRejectedValueOnce(new Error("Incorrect code. Ask the client to confirm the OTP."));

    await render(<PickupOtpScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => expect(dutyService.requestPickupOtp).toHaveBeenCalledTimes(1));
    await enterCode("000000");
    await waitFor(() => pressVerify());

    expect(await screen.findByText("Incorrect code. Ask the client to confirm the OTP.")).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("resend calls the real request endpoint again, not a local no-op", async () => {
    dutyService.requestPickupOtp.mockResolvedValue(undefined);

    await render(<PickupOtpScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => expect(dutyService.requestPickupOtp).toHaveBeenCalledTimes(1));

    await waitFor(() => fireEvent.press(screen.getByText("Resend code")));

    await waitFor(() => expect(dutyService.requestPickupOtp).toHaveBeenCalledTimes(2));
  });
});
