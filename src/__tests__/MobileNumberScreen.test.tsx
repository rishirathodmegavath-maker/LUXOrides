import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { MobileNumberScreen } from "../screens/auth/MobileNumberScreen";

// P1 live-bug coverage: sendOtp() previously had no catch handler at all --
// a failure silently reset loading with zero driver-facing feedback.

jest.mock("../services", () => ({
  authService: {
    sendOtp: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authService } = require("../services");

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

async function renderScreen() {
  return render(<MobileNumberScreen navigation={navigation} route={undefined as never} />);
}

// fireEvent.changeText/press are themselves async in this RNTL version --
// each must be awaited or the following assertion reads a stale render.
async function fillPhoneAndSubmit() {
  const input = screen.getByPlaceholderText("Enter your Phone Number");
  await fireEvent.changeText(input, "9876543210");
  const continueButton = screen.getByText("Continue");
  await fireEvent.press(continueButton);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MobileNumberScreen", () => {
  test("a failed sendOtp shows a real error instead of failing silently", async () => {
    authService.sendOtp.mockRejectedValue(new Error("DRIVER_NOT_FOUND"));

    await renderScreen();
    await fillPhoneAndSubmit();

    await waitFor(() => expect(screen.getByText("DRIVER_NOT_FOUND")).toBeTruthy());
    expect(navigate).not.toHaveBeenCalled();
  });

  test("the loading state resets after a failure, so the driver can retry", async () => {
    authService.sendOtp.mockRejectedValueOnce(new Error("Network request failed"));
    authService.sendOtp.mockResolvedValueOnce({ phone: "9876543210", expiresInSeconds: 60 });

    await renderScreen();
    await fillPhoneAndSubmit();

    await waitFor(() => expect(screen.getByText("Network request failed")).toBeTruthy());

    // Retry: the button must be tappable again, and a second attempt can succeed.
    const continueButton = screen.getByText("Continue");
    await fireEvent.press(continueButton);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("Otp", { phone: "9876543210" }));
    expect(authService.sendOtp).toHaveBeenCalledTimes(2);
  });
});
