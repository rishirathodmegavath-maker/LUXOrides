import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AcceptDutyScreen } from "../screens/duty/AcceptDutyScreen";
import { useDutyStore } from "../store/dutyStore";

// Reliability hardening: getTodayDuty() had no error state -- a fetch
// failure left todayDuty null and rendered an indistinguishable near-blank
// screen, with no way to tell "failed to load" from "nothing assigned yet".

jest.mock("../services", () => ({
  dutyService: {
    getTodayDuty: jest.fn(),
    acceptDuty: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const replace = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, replace, goBack } as unknown as never;

const duty = {
  id: "duty-1",
  type: "AIRPORT_TRANSFER",
  reportTime: "10:00 AM",
  clientName: "Jane Doe",
  pickup: { address: "Pickup address" },
  dropoff: { address: "Dropoff address" },
  driverAcceptedAt: null,
} as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  useDutyStore.setState({ online: false, todayDuty: null });
});

describe("AcceptDutyScreen -- load", () => {
  test("a fetch failure shows a real error, never a fabricated no-duty state", async () => {
    dutyService.getTodayDuty.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<AcceptDutyScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Couldn't load this duty.")).toBeTruthy());
  });

  test("retry re-fetches and renders the duty on success", async () => {
    dutyService.getTodayDuty.mockRejectedValueOnce(new Error("Network request failed"));
    dutyService.getTodayDuty.mockResolvedValueOnce(duty);

    await render(<AcceptDutyScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => expect(screen.getByText("Couldn't load this duty.")).toBeTruthy());

    await waitFor(() => fireEvent.press(screen.getByText("Retry")));

    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
    expect(dutyService.getTodayDuty).toHaveBeenCalledTimes(2);
  });
});

describe("AcceptDutyScreen -- accept", () => {
  test("accept failure alerts and resets loading so the driver can retry", async () => {
    useDutyStore.setState({ online: false, todayDuty: duty });
    dutyService.acceptDuty.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<AcceptDutyScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => fireEvent.press(screen.getByText("Accept Duty")));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't accept duty", "Network request failed"));
    expect(replace).not.toHaveBeenCalled();

    dutyService.acceptDuty.mockResolvedValueOnce(undefined);
    await waitFor(() => fireEvent.press(screen.getByText("Accept Duty")));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("UniformSelfie"));
    expect(dutyService.acceptDuty).toHaveBeenCalledTimes(2);
  });
});
