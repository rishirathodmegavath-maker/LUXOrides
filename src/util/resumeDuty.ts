import { dutyApi } from "../api/duty.api";
import { ApiError } from "../api/errors";
import { toDutySummary } from "../services/real/FleetovoDutyService";
import { dutyStorage } from "../storage/dutyStorage";
import { useDutyStore } from "../store/dutyStore";

export type DutyResumeTarget = "PickupOtp" | "DropOff" | "PaymentQr" | "GarageMap";

/*
 * Reconciles a persisted execution token against the real Fleetovo endpoint
 * (GET /driver/app/duties/{dutyId}) rather than trusting local React/Zustand
 * state, which is lost on an app restart. Called from HomeScreen whenever it
 * regains focus (covers a cold start, since Home is the first screen shown
 * post-auth).
 *
 * Returns the duty-flow screen to resume into, or null if there is nothing
 * genuinely in progress to resume (no persisted duty, or the backend no
 * longer considers it resumable — cancelled, or somehow never actually
 * started despite a locally-persisted token). On a resumable duty, restores
 * executionToken + todayDuty into the store so DropOffScreen/PaymentQrScreen
 * find valid state already in place instead of throwing "Duty was never
 * started."
 */
export async function reconcileActiveDuty(): Promise<DutyResumeTarget | null> {
  const persisted = await dutyStorage.getActiveDuty();
  if (!persisted) return null;

  let dto;
  try {
    dto = await dutyApi.getDuty(persisted.dutyId);
  } catch (e) {
    // Only a real 404 (DUTY_NOT_FOUND -- reassigned, deleted, org mismatch,
    // or genuinely never existed) means the persisted reference is stale
    // and safe to drop. Everything else -- a 401 from an expired JWT
    // (session expiry is exactly what this function must survive), a
    // network blip, a 5xx -- must NOT be treated the same way: this used
    // to swallow every failure alike and permanently clear the driver's
    // only pointer back to their real active duty, so a transient failure
    // right when the driver returns from re-login could silently lose it
    // for good. Propagate instead so the caller (HomeScreen) shows a
    // retryable error and reconciliation is simply attempted again.
    if (e instanceof ApiError && e.status === 404) {
      await dutyStorage.clearActiveDuty();
      return null;
    }
    throw e;
  }

  if (dto.status === "CANCELLED") {
    await dutyStorage.clearActiveDuty();
    return null;
  }

  if (!dto.startAt) {
    // We only ever persist right before calling /start — if the backend
    // still has no startAt, that call never actually completed. Nothing
    // safe to resume into; the driver has to start the duty again.
    await dutyStorage.clearActiveDuty();
    return null;
  }

  useDutyStore.getState().setExecutionToken(persisted.executionToken);
  useDutyStore.getState().setTodayDuty(toDutySummary(dto));

  // pickupOtpVerifiedAt is the backend's own authoritative record, never
  // inferred from endAt/local navigation/last-visited-screen state -- a
  // driver whose duty was interrupted before pickup verification must
  // resume back into that step, never straight into the trip/drop-off
  // flow (the backend now rejects /end for exactly this reason too, see
  // ExternalDriverDutyService.completeDutyEntryAndFinalizeBooking).
  if (!dto.endAt) return dto.pickupOtpVerifiedAt ? "DropOff" : "PickupOtp";

  // Fully closed (real backend confirmation, not local state) -- nothing
  // left to resume into. The duty already shows up in history.
  if (dto.dutyClosedAt) {
    await dutyStorage.clearActiveDuty();
    return null;
  }

  // Garage return already confirmed -- resume straight to GarageMap rather
  // than sending the driver back through payment/signature/back-to-garage
  // screens they've already real-confirmed.
  if (dto.garageReturnConfirmedAt) return "GarageMap";

  return "PaymentQr";
}
