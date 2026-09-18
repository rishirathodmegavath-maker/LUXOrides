import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { TripDetailsScreen } from "../screens/home/TripDetailsScreen";

// Reliability hardening: getTripById() swallowed every failure into null,
// so a network/server error was indistinguishable from a genuinely
// nonexistent trip. Fixed at FleetovoDutyService.getTripById -- only a real
// 404 resolves to null now; every other failure rejects.

jest.mock("../services", () => ({
  dutyService: {
    getTripById: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const goBack = jest.fn();
const navigation = { goBack } as unknown as never;
const route = { params: { dutyId: "duty-1" } } as unknown as never;

const trip = {
  id: "duty-1",
  type: "AIRPORT_TRANSFER",
  date: "12 Sep",
  clientName: "Jane Doe",
  pickupAddress: "Pickup address",
  dropoffAddress: "Dropoff address",
  fare: 1200,
} as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TripDetailsScreen", () => {
  test("a genuine not-found (resolves null) renders without an error banner", async () => {
    dutyService.getTripById.mockResolvedValue(null);

    await render(<TripDetailsScreen navigation={navigation} route={route} />);

    await waitFor(() => expect(dutyService.getTripById).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Couldn't load this trip.")).toBeNull();
    expect(screen.queryByText("Jane Doe")).toBeNull();
  });

  test("a network/server error shows a distinct retryable error, not a not-found state", async () => {
    dutyService.getTripById.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<TripDetailsScreen navigation={navigation} route={route} />);

    await waitFor(() => expect(screen.getByText("Couldn't load this trip.")).toBeTruthy());

    dutyService.getTripById.mockResolvedValueOnce(trip);
    await waitFor(() => fireEvent.press(screen.getByText("Retry")));

    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
    expect(dutyService.getTripById).toHaveBeenCalledTimes(2);
  });

  // Privacy fix: the driver must never see the fare, even here where it was
  // previously displayed for both upcoming and completed trips.
  test("never shows the fare, even though the trip data carries one", async () => {
    dutyService.getTripById.mockResolvedValue(trip);

    await render(<TripDetailsScreen navigation={navigation} route={route} />);

    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
    expect(screen.queryByText("Fare")).toBeNull();
    expect(screen.queryByText(/₹/)).toBeNull();
  });
});
