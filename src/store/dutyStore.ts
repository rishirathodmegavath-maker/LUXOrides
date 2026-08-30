import { create } from "zustand";
import { DutyEndResult, DutySummary, ReadinessChecklist } from "../services/types";
import { dutyStorage } from "../storage/dutyStorage";

interface DutyState {
  online: boolean;
  todayDuty: DutySummary | null;
  checklist: ReadinessChecklist;
  readinessStatus: "pending" | "submitted" | "approved";
  // The real backend's per-duty execution token (minted by FleetovoDutyService.
  // startDuty, consumed by endDuty/checkPaymentStatus) and the result of
  // ending a real duty — both null throughout the mock-only path.
  executionToken: string | null;
  dutyEndResult: DutyEndResult | null;
  setOnline: (online: boolean) => void;
  setTodayDuty: (duty: DutySummary | null) => void;
  updateChecklist: (partial: Partial<ReadinessChecklist>) => void;
  setReadinessStatus: (status: DutyState["readinessStatus"]) => void;
  setExecutionToken: (token: string | null) => void;
  setDutyEndResult: (result: DutyEndResult | null) => void;
  resetDuty: () => void;
}

export const useDutyStore = create<DutyState>((set) => ({
  online: false,
  todayDuty: null,
  checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
  readinessStatus: "pending",
  executionToken: null,
  dutyEndResult: null,
  setOnline: (online) => set({ online }),
  setTodayDuty: (todayDuty) => set({ todayDuty }),
  updateChecklist: (partial) => set((s) => ({ checklist: { ...s.checklist, ...partial } })),
  setReadinessStatus: (readinessStatus) => set({ readinessStatus }),
  setExecutionToken: (executionToken) => set({ executionToken }),
  setDutyEndResult: (dutyEndResult) => set({ dutyEndResult }),
  resetDuty: () => {
    // Fire-and-forget: the persisted SecureStore entry only matters for
    // resuming a genuinely active duty, and this duty is now done (the two
    // call sites are DutyClosedScreen and DeclineDutyScreen) — nothing
    // downstream needs to await the clear completing.
    dutyStorage.clearActiveDuty().catch(() => {});
    set({
      checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
      readinessStatus: "pending",
      executionToken: null,
      dutyEndResult: null,
    });
  },
}));
