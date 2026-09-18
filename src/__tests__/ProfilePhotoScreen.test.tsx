import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ProfilePhotoScreen } from "../screens/onboarding/ProfilePhotoScreen";
import { useOnboardingStore } from "../store/onboardingStore";

// Reliability hardening: same class of bug as DocUploadScreen -- an
// unhandled uploadDocument rejection left `status` stuck at "uploading".

jest.mock("../services", () => ({
  onboardingService: {
    uploadDocument: jest.fn(),
  },
}));

jest.mock("../components", () => {
  const actual = jest.requireActual("../components");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require("react-native");
  return {
    ...actual,
    PhotoCapture: ({
      onCapture,
      status,
      errorText,
    }: {
      onCapture: (uri: string) => void;
      status: string;
      errorText?: string;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          Pressable,
          { onPress: () => onCapture("file://selfie.jpg"), disabled: status === "uploading", accessibilityRole: "button" },
          React.createElement(Text, null, "Capture")
        ),
        React.createElement(Text, null, `status:${status}`),
        errorText ? React.createElement(Text, null, errorText) : null
      ),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { onboardingService } = require("../services");

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.setState({ garageDone: false, photoDone: false, garageName: null });
});

describe("ProfilePhotoScreen", () => {
  test("a verified upload unlocks Submit", async () => {
    onboardingService.uploadDocument.mockResolvedValue({ status: "verified" });

    await render(<ProfilePhotoScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => fireEvent.press(screen.getByText("Capture")));

    await waitFor(() => expect(screen.getByText("status:verified")).toBeTruthy());
    expect(screen.getByText("Submit").props.accessibilityState?.disabled).toBeFalsy();
  });

  test("an upload failure leaves the capture retryable instead of stuck uploading", async () => {
    onboardingService.uploadDocument.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<ProfilePhotoScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => fireEvent.press(screen.getByText("Capture")));

    await waitFor(() => expect(screen.getByText("status:failed")).toBeTruthy());
    expect(screen.getByText("Network request failed")).toBeTruthy();
    expect(screen.getByText("Redo & Resubmit")).toBeTruthy();

    onboardingService.uploadDocument.mockResolvedValueOnce({ status: "verified" });
    await waitFor(() => fireEvent.press(screen.getByText("Capture")));

    await waitFor(() => expect(screen.getByText("status:verified")).toBeTruthy());
    expect(onboardingService.uploadDocument).toHaveBeenCalledTimes(2);
  });
});
