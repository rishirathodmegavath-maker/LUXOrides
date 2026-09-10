import { create } from "zustand";

interface VersionState {
  forceUpdateRequired: boolean;
  latestVersion: string | null;
  // Snapshotted once at launch from dutyStorage (the same SecureStore
  // pointer resumeDuty.ts reads), not the in-memory duty store --
  // useDutyStore's executionToken is still null at the moment this runs
  // (reconcileActiveDuty hasn't fired yet, it only runs once HomeScreen
  // gains focus), so it can't answer "does this driver have a real active
  // duty" this early. Checked once per launch, not re-evaluated mid-session
  // (no polling) -- a duty that completes mid-session simply means the
  // gate re-asserts correctly on the driver's next relaunch.
  hadActiveDutyAtLaunch: boolean;
  setVersionCheck: (result: { forceUpdate: boolean; latestVersion: string }) => void;
  setHadActiveDutyAtLaunch: (had: boolean) => void;
}

export const useVersionStore = create<VersionState>((set) => ({
  forceUpdateRequired: false,
  latestVersion: null,
  hadActiveDutyAtLaunch: false,
  setVersionCheck: ({ forceUpdate, latestVersion }) => set({ forceUpdateRequired: forceUpdate, latestVersion }),
  setHadActiveDutyAtLaunch: (hadActiveDutyAtLaunch) => set({ hadActiveDutyAtLaunch }),
}));
