import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { DutyReadinessSubmitScreen } from "../screens/duty/DutyReadinessSubmitScreen";
import { useDutyStore } from "../store/dutyStore";

// Secondary silent-error fix: `submitting` correctly reset on failure, but
// nothing told the driver why the submission didn't go through.

jest.mock("../services", () => ({
  dutyService: {
    submitReadiness: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

const readyChecklist = {
  uniformSelfieUri: "file://a.jpg",
  vehicleExteriorUris: { front: "file://b.jpg" },
  vehicleInteriorUris: { front: "file://c.jpg" },
  exteriorCondition: "GOOD",
  interiorCondition: "GOOD",
  cleanliness: "CLEAN",
  tyreCondition: "GOOD",
  lightsCondition: "GOOD",
  fuelLevel: "FULL",
  driverConfirmed: true,
} as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  useDutyStore.setState({ checklist: readyChecklist });
});

describe("DutyReadinessSubmitScreen", () => {
  test("a submission failure alerts the driver and resets submitting so they can retry", async () => {
    dutyService.submitReadiness.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<DutyReadinessSubmitScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => fireEvent.press(screen.getByText("Submit to Operations")));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't submit", "Network request failed"));
    expect(navigate).not.toHaveBeenCalled();

    dutyService.submitReadiness.mockResolvedValueOnce(undefined);
    await waitFor(() => fireEvent.press(screen.getByText("Submit to Operations")));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("DutyStartMap"));
    expect(dutyService.submitReadiness).toHaveBeenCalledTimes(2);
  });
});
