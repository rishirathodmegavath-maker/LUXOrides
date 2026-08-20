import { create } from "zustand";
import { DutySummary, ReadinessChecklist } from "../services/types";

interface DutyState {
  online: boolean;
  todayDuty: DutySummary | null;
  checklist: ReadinessChecklist;
  readinessStatus: "pending" | "submitted" | "approved";
  setOnline: (online: boolean) => void;
  setTodayDuty: (duty: DutySummary | null) => void;
  updateChecklist: (partial: Partial<ReadinessChecklist>) => void;
  setReadinessStatus: (status: DutyState["readinessStatus"]) => void;
  resetDuty: () => void;
}

export const useDutyStore = create<DutyState>((set) => ({
  online: false,
  todayDuty: null,
  checklist: { vehicleExteriorUris: [], vehicleInteriorUris: [] },
  readinessStatus: "pending",
  setOnline: (online) => set({ online }),
  setTodayDuty: (todayDuty) => set({ todayDuty }),
  updateChecklist: (partial) => set((s) => ({ checklist: { ...s.checklist, ...partial } })),
  setReadinessStatus: (readinessStatus) => set({ readinessStatus }),
  resetDuty: () =>
    set({ checklist: { vehicleExteriorUris: [], vehicleInteriorUris: [] }, readinessStatus: "pending" }),
}));
