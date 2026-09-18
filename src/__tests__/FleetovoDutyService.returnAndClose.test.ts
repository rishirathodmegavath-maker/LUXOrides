import { FleetovoDutyService } from "../services/real/FleetovoDutyService";
import { useDutyStore } from "../store/dutyStore";

// Driver App audit priority coverage: BackToGarageScreen/GarageMapScreen's
// "Arrived at Garage" and "Close Duty" actions must reach the real,
// execution-token-authenticated endpoints -- neither is a re-billing step
// (the fare is already final by this point, see BackToGarageScreen's own
// comment), just real operational checkpoints.

jest.mock("../api/duty.api", () => ({
  dutyApi: {
    confirmGarageReturn: jest.fn(),
    closeDuty: jest.fn(),
  },
}));

jest.mock("../util/network", () => ({
  assertOnline: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");

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

describe("FleetovoDutyService.returnToGarage", () => {
  test("confirms the real garage return with the active duty's execution token and location", async () => {
    useDutyStore.setState({ executionToken: "exec-token-1" });
    dutyApi.confirmGarageReturn.mockResolvedValue({ success: true });

    await new FleetovoDutyService().returnToGarage({
      formattedAddress: "Garage Addr",
      latitude: 28.6,
      longitude: 77.2,
      accuracyMeters: 10,
    });

    const [token, payload] = dutyApi.confirmGarageReturn.mock.calls[0];
    expect(token).toBe("exec-token-1");
    expect(payload.location).toEqual({ formattedAddress: "Garage Addr", latitude: 28.6, longitude: 77.2 });
    expect(payload.accuracyMeters).toBe(10);
  });

  test("still confirms with a null location when GPS wasn't available -- best-effort, never blocks", async () => {
    useDutyStore.setState({ executionToken: "exec-token-1" });
    dutyApi.confirmGarageReturn.mockResolvedValue({ success: true });

    await new FleetovoDutyService().returnToGarage(null);

    expect(dutyApi.confirmGarageReturn).toHaveBeenCalledWith("exec-token-1", null);
  });

  test("throws rather than silently no-op-ing when there is no active duty", async () => {
    useDutyStore.setState({ executionToken: null });

    await expect(new FleetovoDutyService().returnToGarage(null)).rejects.toThrow();
    expect(dutyApi.confirmGarageReturn).not.toHaveBeenCalled();
  });
});

describe("FleetovoDutyService.closeDuty", () => {
  test("closes the real duty with the active execution token", async () => {
    useDutyStore.setState({ executionToken: "exec-token-1" });
    dutyApi.closeDuty.mockResolvedValue({ success: true });

    await new FleetovoDutyService().closeDuty();

    expect(dutyApi.closeDuty).toHaveBeenCalledWith("exec-token-1");
  });

  test("throws rather than silently no-op-ing when there is no active duty", async () => {
    useDutyStore.setState({ executionToken: null });

    await expect(new FleetovoDutyService().closeDuty()).rejects.toThrow();
    expect(dutyApi.closeDuty).not.toHaveBeenCalled();
  });

  test("propagates a real backend failure rather than swallowing it", async () => {
    useDutyStore.setState({ executionToken: "exec-token-1" });
    dutyApi.closeDuty.mockRejectedValueOnce(new Error("Duty already closed"));

    await expect(new FleetovoDutyService().closeDuty()).rejects.toThrow("Duty already closed");
  });
});
