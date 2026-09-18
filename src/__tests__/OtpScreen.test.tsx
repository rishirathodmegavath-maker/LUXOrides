import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { OtpScreen } from "../screens/auth/OtpScreen";
import { useAuthStore } from "../store/authStore";

// Driver App audit priority coverage: login is real, backend-verified OTP
// (FleetovoAuthService.verifyOtp -> AuthenticationService) -- there is no
// client-side success condition (no hardcoded code).

jest.mock("../services", () => ({
  authService: {
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authService } = require("../services");

const navigation = { goBack: jest.fn() } as unknown as never;
const route = { params: { phone: "9876543210" } } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null, approvalStatus: "pending" });
});

// OtpField renders one hidden TextInput overlaying the visual digit boxes
// (see its own comment) -- testID is a test-only addition to reach it.
async function enterCode(code: string) {
  const input = screen.getByTestId("otp-code-input");
  await waitFor(() => fireEvent.changeText(input, code));
}

describe("OtpScreen", () => {
  test("a correct code calls the real backend verification and sets a real session", async () => {
    authService.verifyOtp.mockResolvedValue({ driverId: "d1", phone: "+919876543210", isNewUser: false });

    await render(<OtpScreen navigation={navigation} route={route} />);
    await enterCode("123456");
    await waitFor(() => fireEvent.press(screen.getByText("Verify")));

    await waitFor(() => expect(authService.verifyOtp).toHaveBeenCalledWith("9876543210", "123456"));
    expect(await screen.findByText("Verified successfully")).toBeTruthy();

    // Real timers here (the file scopes fake timers to the resend-countdown
    // test only, to avoid a still-pending countdown tick from one test
    // desyncing another's timer advancement) -- the post-verify navigation
    // delay is genuinely brief, so waiting it out for real is simpler and
    // no less reliable than faking just this one interval.
    await waitFor(
      () =>
        expect(useAuthStore.getState().session).toEqual({
          driverId: "d1",
          phone: "+919876543210",
          isNewUser: false,
        }),
      { timeout: 2000 }
    );
  });

  test("a real backend rejection shows the server's own error and never fakes success", async () => {
    authService.verifyOtp.mockRejectedValueOnce(new Error("Incorrect code. Ask the client to confirm the OTP."));

    await render(<OtpScreen navigation={navigation} route={route} />);
    await enterCode("000000");
    await waitFor(() => fireEvent.press(screen.getByText("Verify")));

    expect(await screen.findByText("Incorrect code. Ask the client to confirm the OTP.")).toBeTruthy();
    expect(useAuthStore.getState().session).toBeNull();
  });

  test("resend calls the real resend endpoint, not a local no-op", async () => {
    authService.resendOtp.mockResolvedValue({ phone: "9876543210", expiresInSeconds: 60 });
    jest.useFakeTimers();

    try {
      await render(<OtpScreen navigation={navigation} route={route} />);

      // The 45s countdown re-registers its setTimeout inside a useEffect on
      // every tick -- a single advanceTimersByTime(45000) only fires the one
      // timer that already exists and never reaches 0, since the *next*
      // timer isn't scheduled until React re-renders. Ticking one second at
      // a time inside act() lets each re-render's effect register the next
      // one before advancing again.
      for (let i = 0; i < 45; i += 1) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      await waitFor(() => fireEvent.press(screen.getByText("Resend code")));
      expect(authService.resendOtp).toHaveBeenCalledWith("9876543210");
    } finally {
      jest.useRealTimers();
    }
  });
});
