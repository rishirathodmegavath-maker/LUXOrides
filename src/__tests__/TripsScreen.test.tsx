import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { TripsScreen } from "../screens/home/TripsScreen";

// Reliability hardening: getTrips() failure left `trips` at [] forever,
// rendering the exact same "No trips yet" empty state as a driver who
// genuinely has none.

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    // useFocusEffect normally only fires on navigation focus, which this
    // test environment never emits -- run the callback once on mount instead,
    // matching how the screen behaves on its very first real focus.
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const navigation = { navigate } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
});

function trip(id: string, status: "upcoming" | "completed" | "cancelled") {
  return {
    id,
    type: "Audi A6",
    clientName: "Mr. Rahul Sharma",
    date: "21 Aug 2026, 10:30 am",
    status,
    pickupAddress: "Farm 47, Umbrella Estate Rd, New Delhi",
    dropoffAddress: "IGI Airport, New Delhi",
    fare: 1200,
  };
}

describe("TripsScreen", () => {
  test("a genuinely empty list shows the empty state, not an error", async () => {
    dutyService.getTrips.mockResolvedValue([]);

    await render(<TripsScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("No upcoming trips")).toBeTruthy());
    expect(screen.queryByText("Couldn't load your trips.")).toBeNull();
  });

  test("a load failure shows a distinct retryable error, not the empty state", async () => {
    dutyService.getTrips.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<TripsScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Couldn't load your trips.")).toBeTruthy());
    expect(screen.queryByText("No upcoming trips")).toBeNull();

    dutyService.getTrips.mockResolvedValueOnce([]);
    await waitFor(() => fireEvent.press(screen.getByText("Retry")));

    await waitFor(() => expect(screen.getByText("No upcoming trips")).toBeTruthy());
    expect(dutyService.getTrips).toHaveBeenCalledTimes(2);
  });

  test("splits trips into Upcoming and Past Journeys tabs, with cancelled trips counted as past", async () => {
    dutyService.getTrips.mockResolvedValue([
      trip("t1", "upcoming"),
      trip("t2", "completed"),
      trip("t3", "cancelled"),
    ]);

    await render(<TripsScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Upcoming (1)")).toBeTruthy());
    expect(screen.getByText("Past Journeys (2)")).toBeTruthy();
    // Default tab is Upcoming -- only the one upcoming trip's status pill shows.
    expect(screen.getAllByText("upcoming")).toHaveLength(1);

    fireEvent.press(screen.getByText("Past Journeys (2)"));

    await waitFor(() => expect(screen.getByText("completed")).toBeTruthy());
    expect(screen.getByText("cancelled")).toBeTruthy();
    expect(screen.queryByText("upcoming")).toBeNull();
  });
});
