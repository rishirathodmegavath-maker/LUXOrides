import { FleetovoDutyService } from "../services/real/FleetovoDutyService";
import { useDutyStore } from "../store/dutyStore";

// ArrivedAtDropOffScreen's "Continue" previously called nothing on the
// backend at all (MockDutyService, a local 500ms delay). Mirrors
// FleetovoDutyService.markArrivedAtPickup.test.ts for the other end of the
// trip. Unlike markArrivedAtPickup (best-effort, PickupMapScreen navigates
// regardless), this screen blocks and retries on failure, so this call
// checks connectivity up front -- verified here via assertOnline.

jest.mock("../api/duty.api", () => ({
  dutyApi: {
    markArrivedAtDropoff: jest.fn(),
  },
}));

jest.mock("../util/network", () => ({
  assertOnline: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { assertOnline } = require("../util/network");

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

describe("FleetovoDutyService.markArrivedAtDropoff", () => {
  test("calls the real backend endpoint with the active duty's execution token", async () => {
    useDutyStore.setState({ executionToken: "exec-token-1" });
    dutyApi.markArrivedAtDropoff.mockResolvedValue({ success: true, arrivedAt: "2026-09-17T10:00:00Z" });

    await new FleetovoDutyService().markArrivedAtDropoff();

    expect(assertOnline).toHaveBeenCalled();
    expect(dutyApi.markArrivedAtDropoff).toHaveBeenCalledWith("exec-token-1");
  });

  test("throws rather than silently no-op-ing when there is no active duty", async () => {
    useDutyStore.setState({ executionToken: null });

    await expect(new FleetovoDutyService().markArrivedAtDropoff()).rejects.toThrow();
    expect(dutyApi.markArrivedAtDropoff).not.toHaveBeenCalled();
  });

  test("propagates a real backend failure rather than swallowing it", async () => {
    useDutyStore.setState({ executionToken: "exec-token-1" });
    dutyApi.markArrivedAtDropoff.mockRejectedValueOnce(new Error("Network request failed"));

    await expect(new FleetovoDutyService().markArrivedAtDropoff()).rejects.toThrow("Network request failed");
  });
});
