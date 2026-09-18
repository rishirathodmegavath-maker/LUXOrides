import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { HomeScreen } from "../screens/home/HomeScreen";
import { useDutyStore } from "../store/dutyStore";

// Reliability hardening: profile/duty/reconciliation loads each swallowed
// their own failure entirely -- a network error looked identical to "no
// duty assigned yet" or a driver with no name, with no way to retry.

// See ProfileScreen.test.tsx: SafeAreaProvider never resolves real metrics
// in this test renderer without this mock, so nothing below it renders.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over top-level imports
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

jest.mock("../services", () => ({
  driverService: {
    getProfile: jest.fn(),
  },
  dutyService: {
    getTodayDuty: jest.fn(),
  },
}));

jest.mock("../util/resumeDuty", () => ({
  reconcileActiveDuty: jest.fn(),
}));

jest.mock("../api/notification.api", () => ({
  notificationApi: {
    list: jest.fn(),
  },
}));

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    // useFocusEffect requires a real NavigationContainer ancestor, which
    // this screen-level test doesn't render -- run the callback once on
    // mount instead, matching how the screen behaves on its very first
    // real focus (see TripsScreen.test.tsx for the same pattern).
    useFocusEffect: (cb: () => void) => {
      const React = jest.requireActual("react");
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, [cb]);
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { driverService, dutyService } = require("../services");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { reconcileActiveDuty } = require("../util/resumeDuty");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { notificationApi } = require("../api/notification.api");

const navigate = jest.fn();
const dispatch = jest.fn();
const navigation = { navigate, dispatch } as unknown as never;

const duty = {
  id: "duty-1",
  type: "AIRPORT_TRANSFER",
  reportTime: "10:00 AM",
  durationLabel: "5 hrs",
  clientName: "Jane Doe",
  pickup: { address: "Pickup address", distanceKm: null, etaMinutes: null },
  dropoff: { address: "Dropoff address", distanceKm: null, etaMinutes: null },
} as unknown as never;

function renderHome() {
  return render(<HomeScreen navigation={navigation} route={undefined as never} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  useDutyStore.setState({ online: true, todayDuty: null });
  reconcileActiveDuty.mockResolvedValue(null);
  notificationApi.list.mockResolvedValue({ unreadCount: 0, notifications: [] });
});

describe("HomeScreen", () => {
  test("a profile load failure shows a retryable error but does not block the duty card", async () => {
    driverService.getProfile.mockRejectedValueOnce(new Error("Network request failed"));
    dutyService.getTodayDuty.mockResolvedValue(duty);

    await renderHome();

    await waitFor(() => expect(screen.getByText("Couldn't load your latest duty.")).toBeTruthy());
    // The independently-successful duty data still renders.
    await waitFor(() => expect(screen.getByText("AIRPORT_TRANSFER")).toBeTruthy());
  });

  test("a duty load failure shows a retryable error even when profile succeeds", async () => {
    driverService.getProfile.mockResolvedValue({ name: "Raja" });
    dutyService.getTodayDuty.mockRejectedValueOnce(new Error("Network request failed"));

    await renderHome();

    await waitFor(() => expect(screen.getByText("Couldn't load your latest duty.")).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/Raja/)).toBeTruthy());
  });

  test("a reconciliation failure surfaces the same retryable error state", async () => {
    driverService.getProfile.mockResolvedValue({ name: "Raja" });
    dutyService.getTodayDuty.mockResolvedValue(duty);
    reconcileActiveDuty.mockRejectedValueOnce(new Error("Network request failed"));

    await renderHome();

    await waitFor(() => expect(screen.getByText("Couldn't load your latest duty.")).toBeTruthy());
  });

  test("when everything succeeds, no error banner renders", async () => {
    driverService.getProfile.mockResolvedValue({ name: "Raja" });
    dutyService.getTodayDuty.mockResolvedValue(duty);

    await renderHome();

    await waitFor(() => expect(screen.getByText("AIRPORT_TRANSFER")).toBeTruthy());
    expect(screen.queryByText("Couldn't load your latest duty.")).toBeNull();
  });
});
