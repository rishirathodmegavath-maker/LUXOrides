import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AlmostReadyScreen } from "../screens/onboarding/AlmostReadyScreen";
import { useAuthStore } from "../store/authStore";

// Critical onboarding bug: submitForApproval() failure used to leave
// `approving` true forever on a screen with no back button/footer at all --
// the driver was completely stuck. Now failure surfaces a real error with a
// "Try Again" retry that cannot be permanently locked.

jest.mock("../services", () => ({
  onboardingService: {
    submitForApproval: jest.fn(),
    getApprovalStatus: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { onboardingService } = require("../services");

const replace = jest.fn();
const navigation = { replace } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null, permissionsDone: false, approvalStatus: "pending" });
});

describe("AlmostReadyScreen", () => {
  test("a submission failure resets `approving`, shows an error, and offers Try Again -- never a permanent lock", async () => {
    onboardingService.submitForApproval.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<AlmostReadyScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Couldn't submit for approval")).toBeTruthy());
    expect(screen.getByText("Try Again")).toBeTruthy();

    onboardingService.submitForApproval.mockResolvedValueOnce(undefined);
    onboardingService.getApprovalStatus.mockResolvedValueOnce("approved");

    await waitFor(() => fireEvent.press(screen.getByText("Try Again")));

    await waitFor(() => expect(useAuthStore.getState().approvalStatus).toBe("approved"));
    expect(onboardingService.submitForApproval).toHaveBeenCalledTimes(2);
  });

  test("a rejected approval navigates to NotApproved", async () => {
    onboardingService.submitForApproval.mockResolvedValue(undefined);
    onboardingService.getApprovalStatus.mockResolvedValue("rejected");

    await render(<AlmostReadyScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("NotApproved"));
  });
});
