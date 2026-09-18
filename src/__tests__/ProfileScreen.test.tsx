import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ProfileScreen } from "../screens/home/ProfileScreen";

// Reliability hardening: getProfile() had no catch -- a failure rendered
// "—" placeholders indistinguishable from a slow/empty real response.

// react-native-safe-area-context's SafeAreaProvider only resolves real
// metrics from a native onLayout event, which never fires in this test
// renderer -- without this, useSafeAreaInsets() suspends the tree forever
// and nothing below it ever renders (see the library's own jest/mock.tsx).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over top-level imports
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

jest.mock("../services", () => ({
  driverService: {
    getProfile: jest.fn(),
  },
  authService: {
    logout: jest.fn().mockResolvedValue(undefined),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { driverService } = require("../services");

const navigate = jest.fn();
const navigation = { navigate } as unknown as never;

function renderProfile() {
  return render(<ProfileScreen navigation={navigation} route={undefined as never} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ProfileScreen", () => {
  test("a load failure shows a retryable error, not a fabricated empty profile", async () => {
    driverService.getProfile.mockRejectedValueOnce(new Error("Network request failed"));

    await renderProfile();

    await waitFor(() => expect(screen.getByText("Couldn't load your profile.")).toBeTruthy());
  });

  test("retry re-fetches and clears the error once it succeeds", async () => {
    driverService.getProfile.mockRejectedValueOnce(new Error("Network request failed"));
    driverService.getProfile.mockResolvedValueOnce({ name: "Raja Kumar", phone: "9876543210", garageAddress: "Garage A", experienceYears: 5 });

    await renderProfile();
    await waitFor(() => expect(screen.getByText("Couldn't load your profile.")).toBeTruthy());

    await waitFor(() => fireEvent.press(screen.getByText("Retry")));

    await waitFor(() => expect(screen.getByText("Raja Kumar")).toBeTruthy());
    expect(screen.queryByText("Couldn't load your profile.")).toBeNull();
    expect(driverService.getProfile).toHaveBeenCalledTimes(2);
  });

  // Regression: "Garage" and "Experience" were previously display-only rows
  // (showChevron={false}, no onPress) with nothing behind them -- dead taps.
  // Both now route to the real Profile Info edit screen (see
  // ProfileInfoScreen's new "Garage & experience" section), same as every
  // other real row on this screen -- and, since the screen previously had no
  // ScrollView, every row (including Log Out, at the very end) must actually
  // be reachable in the render tree, not just the ones that happened to fit
  // on screen. One test, not two: firing Pressable presses leaves pending
  // internal RN state-update work that isn't fully flushed by the time the
  // test function returns, which corrupted a *separate* test's render when
  // split across two `test()` blocks.
  test("Garage and Experience are real tappable rows, and every row (including Log Out) renders", async () => {
    driverService.getProfile.mockResolvedValue({ name: "Raja Kumar", phone: "9876543210" });

    await renderProfile();
    await waitFor(() => expect(screen.getByText("Raja Kumar")).toBeTruthy());

    for (const label of ["Profile Info", "Garage", "Experience", "Documents", "Payment & Billing", "Help & Support", "Policies & Legal", "Log Out"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }

    fireEvent.press(screen.getByText("Garage"));
    expect(navigate).toHaveBeenCalledWith("ProfileInfo");

    navigate.mockClear();
    fireEvent.press(screen.getByText("Experience"));
    expect(navigate).toHaveBeenCalledWith("ProfileInfo");
  });
});
