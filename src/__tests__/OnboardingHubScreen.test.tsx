import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { OnboardingHubScreen } from "../screens/onboarding/OnboardingHubScreen";
import { useOnboardingStore } from "../store/onboardingStore";

// Reliability hardening: getDocumentStatus() failures for either document
// used to render as "not started", indistinguishable from a driver who
// genuinely hasn't begun that step.

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (cb: () => void) => {
      const React = jest.requireActual("react");
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock("../services", () => ({
  onboardingService: {
    getDocumentStatus: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { onboardingService } = require("../services");

const goBack = jest.fn();
const navigation = { goBack } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.setState({ garageDone: false, photoDone: false, garageName: null });
});

describe("OnboardingHubScreen", () => {
  test("one document's failure does not hide the other document's real, successfully-loaded status", async () => {
    onboardingService.getDocumentStatus.mockImplementation((doc: string) =>
      doc === "drivingLicence" ? Promise.reject(new Error("Network request failed")) : Promise.resolve("verified")
    );

    await render(<OnboardingHubScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Couldn't load your verification status.")).toBeTruthy());
    // Aadhaar's real "verified" status still renders despite licence failing.
    await waitFor(() => expect(screen.getByText("COMPLETED")).toBeTruthy());
    // Licence must not be mislabeled as "not started" -- it falls back to
    // its normal not-yet-verified prompt text, same as before any load ran.
    expect(screen.getByText("Verify your Driving Licence to continue")).toBeTruthy();
  });

  test("no failure -> no error banner, both statuses render", async () => {
    onboardingService.getDocumentStatus.mockImplementation((doc: string) =>
      Promise.resolve(doc === "drivingLicence" ? "verified" : "verifying")
    );

    await render(<OnboardingHubScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("COMPLETED")).toBeTruthy());
    expect(screen.getByText("In review")).toBeTruthy();
    expect(screen.queryByText("Couldn't load your verification status.")).toBeNull();
  });
});
