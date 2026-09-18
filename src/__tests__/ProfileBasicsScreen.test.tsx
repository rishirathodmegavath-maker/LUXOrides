import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ProfileBasicsScreen } from "../screens/onboarding/ProfileBasicsScreen";
import { useAuthStore } from "../store/authStore";

// Secondary silent-error fix: `saving` correctly reset on failure, but
// nothing told the driver why their submission didn't go through.

jest.mock("../services", () => ({
  onboardingService: {
    saveProfileBasics: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { onboardingService } = require("../services");

const replace = jest.fn();
const goBack = jest.fn();
const navigation = { replace, goBack } as unknown as never;

async function fillAllStepsAndSubmit() {
  await waitFor(() => fireEvent.changeText(screen.getByPlaceholderText("Enter your full name"), "Raja Kumar"));
  await waitFor(() => fireEvent.press(screen.getByText("Continue")));
  // Phone step is pre-filled + not editable, just continue.
  await waitFor(() => fireEvent.press(screen.getByText("Continue")));
  await waitFor(() => fireEvent.changeText(screen.getByPlaceholderText("abc@gmail.com"), "raja@example.com"));
  await waitFor(() => fireEvent.press(screen.getByText("Continue")));
  // Experience is optional -- final Continue submits.
  await waitFor(() => fireEvent.press(screen.getByText("Continue")));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  useAuthStore.setState({ session: { driverId: "d1", phone: "9876543210" } as never });
});

describe("ProfileBasicsScreen", () => {
  test("a submission failure alerts the driver and resets saving so they can retry", async () => {
    onboardingService.saveProfileBasics.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<ProfileBasicsScreen navigation={navigation} route={undefined as never} />);
    await fillAllStepsAndSubmit();

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't save", "Network request failed"));
    expect(replace).not.toHaveBeenCalled();

    onboardingService.saveProfileBasics.mockResolvedValueOnce(undefined);
    await waitFor(() => fireEvent.press(screen.getByText("Continue")));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("OnboardingHub"));
    expect(onboardingService.saveProfileBasics).toHaveBeenCalledTimes(2);
  });
});
