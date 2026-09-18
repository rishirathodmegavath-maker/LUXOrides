import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { DocUploadScreen } from "../screens/onboarding/DocUploadScreen";

// Reliability hardening: uploadDocument was awaited with no catch -- a
// failure left `status` stuck at "uploading" forever, and PhotoCapture's
// frame disables itself for the entire duration of "uploading", so the
// driver could never retake the photo.

jest.mock("../services", () => ({
  onboardingService: {
    uploadDocument: jest.fn(),
  },
}));

// Real PhotoCapture drives native camera/permission APIs this environment
// can't exercise -- swapped for a trivial stand-in that calls onCapture
// directly, matching DropOffScreen.test.tsx's established convention.
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
          { onPress: () => onCapture("file://doc.jpg"), disabled: status === "uploading", accessibilityRole: "button" },
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
const route = { params: { doc: "drivingLicence" } } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DocUploadScreen", () => {
  test("a successful upload reaches a settled, non-uploading status", async () => {
    onboardingService.uploadDocument.mockResolvedValue({ status: "verifying" });

    await render(<DocUploadScreen navigation={navigation} route={route} />);
    await waitFor(() => fireEvent.press(screen.getByText("Capture")));

    await waitFor(() => expect(screen.getByText("status:verifying")).toBeTruthy());
  });

  test("an upload failure leaves the capture retryable instead of stuck uploading", async () => {
    onboardingService.uploadDocument.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<DocUploadScreen navigation={navigation} route={route} />);
    await waitFor(() => fireEvent.press(screen.getByText("Capture")));

    // Failure resolves to "failed", not left at "uploading" forever.
    await waitFor(() => expect(screen.getByText("status:failed")).toBeTruthy());
    expect(screen.getByText("Network request failed")).toBeTruthy();
    expect(screen.getByText("Redo & Resubmit")).toBeTruthy();

    // Retake/retry: pressing Capture again is possible (frame is not disabled) and can succeed.
    onboardingService.uploadDocument.mockResolvedValueOnce({ status: "verifying" });
    await waitFor(() => fireEvent.press(screen.getByText("Capture")));

    await waitFor(() => expect(screen.getByText("status:verifying")).toBeTruthy());
    expect(onboardingService.uploadDocument).toHaveBeenCalledTimes(2);
  });
});
