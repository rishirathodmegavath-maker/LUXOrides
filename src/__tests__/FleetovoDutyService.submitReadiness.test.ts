import { FleetovoDutyService } from "../services/real/FleetovoDutyService";
import { useDutyStore } from "../store/dutyStore";
import type { ReadinessChecklist } from "../services/types";

// P1 uniform-selfie contract fix (OPTION A): the driver captures a uniform
// selfie, the readiness screen marks it "verified" and blocks progress on
// it -- submitReadiness must actually transmit it (previously silently
// dropped from the multipart payload) and must refuse to submit without it,
// matching the same "all evidence required" contract as the 8 vehicle
// photos.

jest.mock("../api/duty.api", () => ({
  dutyApi: {
    submitInspection: jest.fn().mockResolvedValue({ id: "inspection-1", received: true }),
  },
}));

jest.mock("../util/network", () => ({
  assertOnline: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");

function completeChecklist(overrides: Partial<ReadinessChecklist> = {}): ReadinessChecklist {
  return {
    uniformSelfieUri: "file://selfie.jpg",
    vehicleExteriorUris: { Front: "file://front.jpg", Back: "file://back.jpg", "Left Side": "file://left.jpg", "Right Side": "file://right.jpg" },
    vehicleInteriorUris: { Dashboard: "file://dash.jpg", "Front Seats": "file://fs.jpg", "Back Seats": "file://bs.jpg", "Boot Space": "file://boot.jpg" },
    exteriorCondition: "GOOD",
    interiorCondition: "GOOD",
    cleanliness: "CLEAN",
    tyreCondition: "GOOD",
    lightsCondition: "GOOD",
    driverConfirmed: true,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useDutyStore.setState({
    online: false,
    todayDuty: {
      id: "duty-1",
      type: "AIRPORT TRANSFER",
      reportTime: "09:30 AM",
      durationLabel: "",
      pickup: { label: "PICKUP", address: "A", distanceKm: null, etaMinutes: null },
      dropoff: { label: "DROP OFF", address: "B", distanceKm: null, etaMinutes: null },
      clientName: "Priya Nair",
      clientPhone: null,
      driverAcceptedAt: "2026-09-08T09:00:00Z",
    },
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: null,
    dutyEndResult: null,
  });
});

describe("FleetovoDutyService.submitReadiness -- uniform selfie contract", () => {
  test("rejects submission when the uniform selfie is missing, even if every other field is complete", async () => {
    const service = new FleetovoDutyService();

    await expect(service.submitReadiness(completeChecklist({ uniformSelfieUri: undefined }))).rejects.toThrow();
    expect(dutyApi.submitInspection).not.toHaveBeenCalled();
  });

  test("includes the uniform selfie as its own multipart part when present", async () => {
    const service = new FleetovoDutyService();

    await service.submitReadiness(completeChecklist());

    expect(dutyApi.submitInspection).toHaveBeenCalledTimes(1);
    const [, , photos] = dutyApi.submitInspection.mock.calls[0];
    expect(photos.uniformSelfie).toEqual({ uri: "file://selfie.jpg", name: "uniformSelfie.jpg", type: "image/jpeg" });
  });
});
