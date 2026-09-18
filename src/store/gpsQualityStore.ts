import { create } from "zustand";
import type { GpsFix } from "../util/gpsQuality";

interface GpsQualityState {
  lastFix: GpsFix | null;
  activeSinceMs: number | null;
  recordFix: (fix: GpsFix) => void;
  markActive: () => void;
  reset: () => void;
}

// Module-scope store (not a hook-local ref) because the real fixes that
// matter most -- background-task pings -- are received inside
// backgroundLocationTask.ts's TaskManager.defineTask callback, which can
// run headlessly with no component tree mounted at all. A plain Zustand
// store is reachable from there the same way dutyStorage/dutyApi already
// are, without a second GPS subscription just to observe fixes the
// background task already received.
export const useGpsQualityStore = create<GpsQualityState>((set) => ({
  lastFix: null,
  activeSinceMs: null,
  recordFix: (fix) => set({ lastFix: fix }),
  markActive: () => set((s) => ({ activeSinceMs: s.activeSinceMs ?? Date.now() })),
  reset: () => set({ lastFix: null, activeSinceMs: null }),
}));
