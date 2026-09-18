import { reconcileActiveDuty } from "../util/resumeDuty";
import { useDutyStore } from "../store/dutyStore";
import { ApiError, NetworkError } from "../api/errors";
import type { DutySummaryForDriverDTO } from "../api/duty.types";

// Session-expiry-during-active-duty recovery: reconcileActiveDuty is the
// single mechanism that restores a driver's real, backend-authoritative
// duty state after re-login. It previously treated ANY getDuty() failure
// (a 401 from an expired JWT included) identically to "this duty doesn't
// belong to me anymore" and permanently deleted the driver's only pointer
// back to their active duty (dutyStorage). These tests lock in the fix:
// only a genuine 404 (DUTY_NOT_FOUND) may drop the persisted reference.

jest.mock("../api/duty.api", () => ({
  dutyApi: { getDuty: jest.fn() },
}));

jest.mock("../storage/dutyStorage", () => ({
  dutyStorage: {
    getActiveDuty: jest.fn(),
    setActiveDuty: jest.fn(),
    clearActiveDuty: jest.fn().mockResolvedValue(undefined),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyStorage } = require("../storage/dutyStorage");

const PERSISTED = { dutyId: "duty-1", executionToken: "exec-token-1" };

function dto(overrides: Partial<DutySummaryForDriverDTO> = {}): DutySummaryForDriverDTO {
  return {
    dutyId: "duty-1",
    bookingId: "booking-1",
    status: "RUNNING",
    clientName: "Jane Doe",
    clientPhone: null,
    vehicleName: "Sedan",
    vehicleNumber: "DL01AB1234",
    reportingLocation: "Pickup address",
    dropLocation: "Drop address",
    reportingTime: "2026-01-01T10:00:00Z",
    dropTime: null,
    startingKM: 100,
    closingKM: null,
    startAt: "2026-01-01T10:05:00Z",
    endAt: null,
    dutyTotal: { amount: 0, currency: "INR" },
    driverAcceptedAt: "2026-01-01T09:00:00Z",
    driverDeclinedAt: null,
    pickupOtpVerifiedAt: null,
    garageReturnConfirmedAt: null,
    dutyClosedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  dutyStorage.getActiveDuty.mockResolvedValue(PERSISTED);
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: null,
    dutyEndResult: null,
  });
});

describe("reconcileActiveDuty -- no active duty", () => {
  test("with nothing persisted, returns null without ever calling the backend", async () => {
    dutyStorage.getActiveDuty.mockResolvedValue(null);

    const result = await reconcileActiveDuty();

    expect(result).toBeNull();
    expect(dutyApi.getDuty).not.toHaveBeenCalled();
  });
});

describe("reconcileActiveDuty -- successful recovery after login", () => {
  test("not yet pickup-verified -> resumes to PickupOtp, restoring execution token + duty into the store", async () => {
    dutyApi.getDuty.mockResolvedValue(dto({ pickupOtpVerifiedAt: null, endAt: null }));

    const result = await reconcileActiveDuty();

    expect(result).toBe("PickupOtp");
    expect(useDutyStore.getState().executionToken).toBe("exec-token-1");
    expect(useDutyStore.getState().todayDuty?.clientName).toBe("Jane Doe");
  });

  test("pickup verified, not yet ended -> resumes to DropOff", async () => {
    dutyApi.getDuty.mockResolvedValue(dto({ pickupOtpVerifiedAt: "2026-01-01T10:10:00Z", endAt: null }));

    expect(await reconcileActiveDuty()).toBe("DropOff");
  });

  test("ended, garage return not yet confirmed -> resumes to PaymentQr", async () => {
    dutyApi.getDuty.mockResolvedValue(
      dto({ pickupOtpVerifiedAt: "2026-01-01T10:10:00Z", endAt: "2026-01-01T12:00:00Z", garageReturnConfirmedAt: null })
    );

    expect(await reconcileActiveDuty()).toBe("PaymentQr");
  });

  test("garage return confirmed, not yet closed -> resumes to GarageMap", async () => {
    dutyApi.getDuty.mockResolvedValue(
      dto({
        endAt: "2026-01-01T12:00:00Z",
        garageReturnConfirmedAt: "2026-01-01T12:30:00Z",
        dutyClosedAt: null,
      })
    );

    expect(await reconcileActiveDuty()).toBe("GarageMap");
  });

  test("no duplicate duty creation: reconciliation only ever reads, never accepts/starts/creates anything", async () => {
    dutyApi.getDuty.mockResolvedValue(dto());
    await reconcileActiveDuty();

    // dutyApi is mocked with getDuty as its only member -- calling any other
    // duty-mutating method would be a TypeError, proving none was invoked.
    expect(Object.keys(dutyApi)).toEqual(["getDuty"]);
    expect(dutyApi.getDuty).toHaveBeenCalledTimes(1);
  });
});

describe("reconcileActiveDuty -- genuinely stale references are dropped", () => {
  test("a real 404 (duty reassigned/deleted/not owned) clears the persisted duty and returns null", async () => {
    dutyApi.getDuty.mockRejectedValue(new ApiError({ code: "DUTY_NOT_FOUND", message: "Duty not found", status: 404, path: "", method: "GET", timestamp: "", traceId: "", technicalMessage: null, exceptionType: null, metadata: null }));

    const result = await reconcileActiveDuty();

    expect(result).toBeNull();
    expect(dutyStorage.clearActiveDuty).toHaveBeenCalledTimes(1);
  });

  test("CANCELLED status clears the persisted duty", async () => {
    dutyApi.getDuty.mockResolvedValue(dto({ status: "CANCELLED" }));

    expect(await reconcileActiveDuty()).toBeNull();
    expect(dutyStorage.clearActiveDuty).toHaveBeenCalledTimes(1);
  });

  test("fully closed (dutyClosedAt set) clears the persisted duty", async () => {
    dutyApi.getDuty.mockResolvedValue(
      dto({ endAt: "2026-01-01T12:00:00Z", garageReturnConfirmedAt: "2026-01-01T12:30:00Z", dutyClosedAt: "2026-01-01T12:35:00Z" })
    );

    expect(await reconcileActiveDuty()).toBeNull();
    expect(dutyStorage.clearActiveDuty).toHaveBeenCalledTimes(1);
  });

  test("never actually started despite a persisted token clears the reference", async () => {
    dutyApi.getDuty.mockResolvedValue(dto({ startAt: null }));

    expect(await reconcileActiveDuty()).toBeNull();
    expect(dutyStorage.clearActiveDuty).toHaveBeenCalledTimes(1);
  });
});

describe("reconcileActiveDuty -- session expiry must NOT lose the active duty", () => {
  test("a 401 (expired JWT) propagates instead of clearing the persisted duty reference", async () => {
    dutyApi.getDuty.mockRejectedValue(new ApiError({ code: "UNAUTHORIZED", message: "Token expired", status: 401, path: "", method: "GET", timestamp: "", traceId: "", technicalMessage: null, exceptionType: null, metadata: null }));

    await expect(reconcileActiveDuty()).rejects.toThrow();

    expect(dutyStorage.clearActiveDuty).not.toHaveBeenCalled();
  });

  test("a transient network failure also propagates without clearing the persisted duty (no stale local duty overriding backend state, but also no false-positive loss)", async () => {
    dutyApi.getDuty.mockRejectedValue(new NetworkError(new Error("fetch failed")));

    await expect(reconcileActiveDuty()).rejects.toThrow();

    expect(dutyStorage.clearActiveDuty).not.toHaveBeenCalled();
  });

  test("a 500 server error also propagates without clearing the persisted duty", async () => {
    dutyApi.getDuty.mockRejectedValue(new ApiError({ code: "SERVER_ERROR", message: "boom", status: 500, path: "", method: "GET", timestamp: "", traceId: "", technicalMessage: null, exceptionType: null, metadata: null }));

    await expect(reconcileActiveDuty()).rejects.toThrow();

    expect(dutyStorage.clearActiveDuty).not.toHaveBeenCalled();
  });

  test("recovering after the transient failure clears up: a later successful call still resumes correctly (duty was never lost)", async () => {
    dutyApi.getDuty.mockRejectedValueOnce(new ApiError({ code: "UNAUTHORIZED", message: "Token expired", status: 401, path: "", method: "GET", timestamp: "", traceId: "", technicalMessage: null, exceptionType: null, metadata: null }));
    await expect(reconcileActiveDuty()).rejects.toThrow();
    expect(dutyStorage.clearActiveDuty).not.toHaveBeenCalled();

    // Persisted reference is still intact -- getActiveDuty still returns it (never cleared above).
    dutyApi.getDuty.mockResolvedValueOnce(dto({ pickupOtpVerifiedAt: "2026-01-01T10:10:00Z", endAt: null }));

    const result = await reconcileActiveDuty();

    expect(result).toBe("DropOff");
    expect(useDutyStore.getState().executionToken).toBe("exec-token-1");
  });
});
