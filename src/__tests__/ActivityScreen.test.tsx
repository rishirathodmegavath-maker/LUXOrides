import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { ActivityScreen } from "../screens/home/ActivityScreen";

// Reliability hardening: getTrips() failure left `trips` at [] forever,
// rendering the same "No activity yet" empty state as a driver with
// genuinely no completed duties.
//
// Privacy fix: the driver must never see fare/earnings figures here (or
// anywhere) -- only completed-trip count and the real combined rating (see
// DriverRatingService on the backend). Total-earnings and per-trip fare
// display were removed; these tests lock that in.

// See ProfileScreen.test.tsx: SafeAreaProvider never resolves real metrics
// in this test renderer without this mock, so nothing below it renders.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over top-level imports
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

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
  dutyService: {
    getTrips: jest.fn(),
  },
}));

jest.mock("../api/driver.api", () => ({
  driverApi: {
    getRating: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { driverApi } = require("../api/driver.api");

function renderActivity() {
  return render(<ActivityScreen navigation={undefined as never} route={undefined as never} />);
}

function trip(id: string, fare: number) {
  return {
    id,
    type: "Audi A6",
    clientName: "Mr. Rahul Sharma",
    date: "21 Aug 2026, 10:30 am",
    status: "completed" as const,
    pickupAddress: "Farm 47, Umbrella Estate Rd",
    dropoffAddress: "IGI Airport",
    fare,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  driverApi.getRating.mockResolvedValue({
    clientAverageRating: null,
    clientRatingCount: 0,
    opsRating: null,
    combinedAverageRating: null,
  });
});

describe("ActivityScreen", () => {
  test("a genuinely empty history shows the empty state, not an error", async () => {
    dutyService.getTrips.mockResolvedValue([]);

    await renderActivity();

    await waitFor(() => expect(screen.getByText("No activity yet")).toBeTruthy());
    expect(screen.queryByText("Couldn't load your activity.")).toBeNull();
  });

  test("a load failure shows a distinct retryable error, not the empty state", async () => {
    dutyService.getTrips.mockRejectedValueOnce(new Error("Network request failed"));

    await renderActivity();

    await waitFor(() => expect(screen.getByText("Couldn't load your activity.")).toBeTruthy());
    expect(screen.queryByText("No activity yet")).toBeNull();
  });

  test("never shows fare/earnings, even when the trip data carries an amount", async () => {
    dutyService.getTrips.mockResolvedValue([trip("t1", 235850), trip("t2", 94500)]);

    await renderActivity();

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy()); // completed-trip count
    expect(screen.queryByText(/₹/)).toBeNull();
    expect(screen.queryByText("235,850")).toBeNull();
    expect(screen.queryByText(/Total Earnings/i)).toBeNull();
  });

  test("shows the real combined rating when one exists", async () => {
    dutyService.getTrips.mockResolvedValue([trip("t1", 235850)]);
    driverApi.getRating.mockResolvedValue({
      clientAverageRating: 4.6,
      clientRatingCount: 8,
      opsRating: 5,
      combinedAverageRating: 4.8,
    });

    await renderActivity();

    await waitFor(() => expect(screen.getByText("4.8")).toBeTruthy());
  });

  test("honestly shows 'Not yet rated' rather than fabricating a rating", async () => {
    dutyService.getTrips.mockResolvedValue([trip("t1", 235850)]);

    await renderActivity();

    await waitFor(() => expect(screen.getByText("Not yet rated")).toBeTruthy());
  });
});
