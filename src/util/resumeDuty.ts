import { dutyApi } from "../api/duty.api";
import { toDutySummary } from "../services/real/FleetovoDutyService";
import { dutyStorage } from "../storage/dutyStorage";
import { useDutyStore } from "../store/dutyStore";

export type DutyResumeTarget = "DropOff" | "PaymentQr" | "GarageMap";

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
  } catch {
    // Duty no longer resolvable for this driver (reassigned, deleted, org
    // mismatch, etc.) — the persisted reference is stale, drop it rather
    // than keep retrying on every focus.
    await dutyStorage.clearActiveDuty();
    return null;
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

  if (!dto.endAt) return "DropOff";

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
