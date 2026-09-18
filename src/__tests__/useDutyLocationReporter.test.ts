import { renderHook, waitFor } from "@testing-library/react-native";
import { useDutyLocationReporter } from "../hooks/useDutyLocationReporter";
import { useDutyStore } from "../store/dutyStore";

// Proves the hook now SURFACES a denied/revoked location permission as
// status "denied" instead of silently doing nothing -- see
// LocationPermissionBanner, the only place this becomes driver-visible.

jest.mock("../tasks/backgroundLocationTask", () => ({
  startBackgroundLocationTracking: jest.fn(),
  stopBackgroundLocationTracking: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-location", () => ({
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  Accuracy: { Balanced: 3 },
}));

jest.mock("../api/duty.api", () => ({
  dutyApi: { reportLocation: jest.fn().mockResolvedValue(undefined) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { startBackgroundLocationTracking } = require("../tasks/backgroundLocationTask");

function setActiveDuty() {
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: "exec-token-1",
    dutyEndResult: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: null,
    dutyEndResult: null,
  });
});

describe("useDutyLocationReporter -- status", () => {
  test("is 'inactive' with no active duty, and never starts tracking", async () => {
    const { result } = await renderHook(() => useDutyLocationReporter());

    await waitFor(() => expect(result.current).toBe("inactive"));
    expect(startBackgroundLocationTracking).not.toHaveBeenCalled();
  });

  test("is 'active' once background tracking is granted", async () => {
    startBackgroundLocationTracking.mockResolvedValue("granted");
    setActiveDuty();

    const { result } = await renderHook(() => useDutyLocationReporter());

    await waitFor(() => expect(result.current).toBe("active"));
  });

  test("is 'foreground-only' when background permission is unavailable but foreground works", async () => {
    startBackgroundLocationTracking.mockResolvedValue("foreground-only");
    setActiveDuty();

    const { result } = await renderHook(() => useDutyLocationReporter());

    await waitFor(() => expect(result.current).toBe("foreground-only"));
  });

  test("is 'denied' when location permission is denied or revoked -- the previously-silent case", async () => {
    startBackgroundLocationTracking.mockResolvedValue("denied");
    setActiveDuty();

    const { result } = await renderHook(() => useDutyLocationReporter());

    await waitFor(() => expect(result.current).toBe("denied"));
  });
});
