import { FleetovoDutyService } from "../services/real/FleetovoDutyService";

// Root-cause fix for "Distance/ETA not available" on Home/DutyStartMap:
// getTodayDuty() previously always left pickup/dropoff distance+ETA null
// (DutySummaryForDriverDTO carries no routing figures). It must now enrich
// them with the real per-leg route (dutyApi.getRouteForDuty), and do so
// honestly -- filling real numbers when the backend has them, leaving null
// when it genuinely doesn't, and never throwing just because one leg's
// route call failed.

jest.mock("../api/duty.api", () => ({
  dutyApi: {
    getActiveDuties: jest.fn(),
    getRouteForDuty: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");

function dto() {
  return {
    dutyId: "duty-1",
    bookingId: "booking-1",
    status: "ALLOTTED",
    clientName: "Client",
    clientPhone: null,
    vehicleName: "Sedan",
    vehicleNumber: "DL01AB1234",
    reportingLocation: "Pickup Address",
    dropLocation: "Drop Address",
    reportingTime: "2026-09-11T09:00:00Z",
    dropTime: null,
    startingKM: null,
    closingKM: null,
    startAt: null,
    endAt: null,
    driverAcceptedAt: null,
    driverDeclinedAt: null,
    pickupOtpVerifiedAt: null,
    garageReturnConfirmedAt: null,
    dutyClosedAt: null,
  };
}

function route(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    leg: "PICKUP",
    available: true,
    distanceKm: 12.5,
    durationSeconds: 1500,
    provider: "OPEN_ROUTE_SERVICE",
    routeAvailable: true,
    fromLocation: null,
    toLocation: null,
    geometry: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("getTodayDuty returns null when there is no active duty", async () => {
  dutyApi.getActiveDuties.mockResolvedValue({ content: [] });

  const result = await new FleetovoDutyService().getTodayDuty();

  expect(result).toBeNull();
  expect(dutyApi.getRouteForDuty).not.toHaveBeenCalled();
});

test("getTodayDuty fills real pickup/drop distance and ETA when the backend has them", async () => {
  dutyApi.getActiveDuties.mockResolvedValue({ content: [dto()] });
  dutyApi.getRouteForDuty.mockImplementation((_dutyId: string, leg: string) =>
    Promise.resolve(leg === "PICKUP" ? route({ leg: "PICKUP", distanceKm: 12.5, durationSeconds: 1500 }) : route({ leg: "DROP", distanceKm: 8, durationSeconds: 900 }))
  );

  const result = await new FleetovoDutyService().getTodayDuty();

  expect(result?.pickup.distanceKm).toBe(12.5);
  expect(result?.pickup.etaMinutes).toBe(25); // 1500s -> 25min
  expect(result?.dropoff.distanceKm).toBe(8);
  expect(result?.dropoff.etaMinutes).toBe(15); // 900s -> 15min
  expect(dutyApi.getRouteForDuty).toHaveBeenCalledWith("duty-1", "PICKUP");
  expect(dutyApi.getRouteForDuty).toHaveBeenCalledWith("duty-1", "DROP");
});

test("getTodayDuty leaves distance/ETA null (not fabricated) when the route is genuinely unavailable", async () => {
  dutyApi.getActiveDuties.mockResolvedValue({ content: [dto()] });
  dutyApi.getRouteForDuty.mockResolvedValue(route({ available: false, distanceKm: null, durationSeconds: null }));

  const result = await new FleetovoDutyService().getTodayDuty();

  expect(result?.pickup.distanceKm).toBeNull();
  expect(result?.pickup.etaMinutes).toBeNull();
});

test("getTodayDuty still returns the duty summary when a route leg call fails outright", async () => {
  dutyApi.getActiveDuties.mockResolvedValue({ content: [dto()] });
  dutyApi.getRouteForDuty.mockRejectedValue(new Error("network error"));

  const result = await new FleetovoDutyService().getTodayDuty();

  expect(result?.id).toBe("duty-1");
  expect(result?.pickup.distanceKm).toBeNull();
});
