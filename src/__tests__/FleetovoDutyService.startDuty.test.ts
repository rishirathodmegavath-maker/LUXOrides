import { FleetovoDutyService } from "../services/real/FleetovoDutyService";
import { useDutyStore } from "../store/dutyStore";

// Driver App audit priority coverage: DutyStartMapScreen's odometer + photo
// + GPS submission must reach the real, execution-token-authenticated
// /start endpoint -- mints a real token first (dutyApi.issueExecutionToken)
// and persists it locally before the /start call, so a restart between the
// two can still reconcile (see the service's own comment).

jest.mock("../api/duty.api", () => ({
  dutyApi: {
    issueExecutionToken: jest.fn(),
    submitStart: jest.fn(),
  },
}));

jest.mock("../storage/dutyStorage", () => ({
  dutyStorage: {
    setActiveDuty: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../util/network", () => ({
  assertOnline: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyStorage } = require("../storage/dutyStorage");

const TODAY_DUTY = {
  id: "duty-1",
  type: "Sedan",
  reportTime: "09:30",
  durationLabel: "",
  clientName: "Client",
  clientPhone: null,
  driverAcceptedAt: null,
  pickup: { label: "PICKUP", address: "Pickup Addr", distanceKm: null, etaMinutes: null },
  dropoff: { label: "DROP OFF", address: "Drop Addr", distanceKm: null, etaMinutes: null },
};

beforeEach(() => {
  jest.clearAllMocks();
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    executionToken: null,
    dutyEndResult: null,
  });
});

describe("FleetovoDutyService.startDuty", () => {
  test("mints a real execution token, persists it, and submits the real odometer/photo/location payload", async () => {
    useDutyStore.setState({ todayDuty: TODAY_DUTY });
    dutyApi.issueExecutionToken.mockResolvedValue({ token: "exec-token-1" });
    dutyApi.submitStart.mockResolvedValue(undefined);

    await new FleetovoDutyService().startDuty({
      odometerKm: 12450,
      photoUri: "file://odometer.jpg",
      location: { formattedAddress: "Near Garage", latitude: 28.6, longitude: 77.2, accuracyMeters: 12 },
    });

    expect(dutyApi.issueExecutionToken).toHaveBeenCalledWith("duty-1");
    expect(dutyStorage.setActiveDuty).toHaveBeenCalledWith({ dutyId: "duty-1", executionToken: "exec-token-1" });
    expect(useDutyStore.getState().executionToken).toBe("exec-token-1");

    const [token, payload, photo] = dutyApi.submitStart.mock.calls[0];
    expect(token).toBe("exec-token-1");
    expect(payload.odometerKm).toBe(12450);
    expect(payload.location).toEqual({ formattedAddress: "Near Garage", latitude: 28.6, longitude: 77.2 });
    expect(payload.accuracyMeters).toBe(12);
    expect(photo).toEqual({ uri: "file://odometer.jpg", name: "odometer-start.jpg", type: "image/jpeg" });
  });

  test("throws rather than silently no-op-ing when there is no active duty to start", async () => {
    useDutyStore.setState({ todayDuty: null });

    await expect(
      new FleetovoDutyService().startDuty({
        odometerKm: 100,
        photoUri: "file://x.jpg",
        location: { formattedAddress: "x", latitude: 0, longitude: 0 },
      })
    ).rejects.toThrow();
    expect(dutyApi.issueExecutionToken).not.toHaveBeenCalled();
  });

  test("propagates a real backend failure rather than swallowing it", async () => {
    useDutyStore.setState({ todayDuty: TODAY_DUTY });
    dutyApi.issueExecutionToken.mockResolvedValue({ token: "exec-token-1" });
    dutyApi.submitStart.mockRejectedValueOnce(new Error("Odometer photo is required"));

    await expect(
      new FleetovoDutyService().startDuty({
        odometerKm: 12450,
        photoUri: "file://odometer.jpg",
        location: { formattedAddress: "x", latitude: 0, longitude: 0 },
      })
    ).rejects.toThrow("Odometer photo is required");
  });
});
