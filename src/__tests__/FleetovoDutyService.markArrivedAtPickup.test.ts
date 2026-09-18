import { FleetovoDutyService } from "../services/real/FleetovoDutyService";
import { useDutyStore } from "../store/dutyStore";

// PickupMapScreen's "Arrived at Pickup" previously called nothing on the
// backend at all -- the customer app had no real way to learn the driver had
// arrived. Verifies the real service call uses the active duty's execution
// token and hits the real endpoint.

jest.mock("../api/duty.api", () => ({
  dutyApi: {
    markArrivedAtPickup: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");

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

describe("FleetovoDutyService.markArrivedAtPickup", () => {
  test("calls the real backend endpoint with the active duty's execution token", async () => {
    useDutyStore.setState({ executionToken: "exec-token-1" });
    dutyApi.markArrivedAtPickup.mockResolvedValue({ success: true, arrivedAt: "2026-09-17T10:00:00Z" });

    await new FleetovoDutyService().markArrivedAtPickup();

    expect(dutyApi.markArrivedAtPickup).toHaveBeenCalledWith("exec-token-1");
  });

  test("throws rather than silently no-op-ing when there is no active duty", async () => {
    useDutyStore.setState({ executionToken: null });

    await expect(new FleetovoDutyService().markArrivedAtPickup()).rejects.toThrow();
    expect(dutyApi.markArrivedAtPickup).not.toHaveBeenCalled();
  });
});
