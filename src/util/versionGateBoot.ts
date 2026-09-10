import Constants from "expo-constants";
import { versionApi } from "../api/version.api";
import type { AppVersionCheckResponse } from "../api/version.api";
import { dutyStorage } from "../storage/dutyStorage";
import type { PersistedActiveDuty } from "../storage/dutyStorage";
import { useVersionStore } from "../store/versionStore";

/*
 * Force-update and "had an active duty at launch" are resolved together in
 * one Promise.all and written to the store together, not as two
 * independently-resolving effects. resolveRootStack reads both off the
 * store on every render; if forceUpdateRequired had flipped true (a fast
 * network response) before hadActiveDutyAtLaunch -- a local SecureStore
 * read -- had resolved, a driver genuinely mid-duty could see a flash of
 * the Update Required screen before the duty check caught up a moment
 * later. Combining them into one write makes that inconsistent
 * intermediate render unreachable, without changing either individual
 * failure policy: a version-check failure still leaves forceUpdateRequired
 * at its default false, and a duty-storage read failure still leaves
 * hadActiveDutyAtLaunch at its default false.
 */
export interface VersionGateDeps {
  getInstalledVersion: () => string;
  checkVersion: (installedVersion: string) => Promise<AppVersionCheckResponse>;
  getActiveDuty: () => Promise<PersistedActiveDuty | null>;
}

const defaultDeps: VersionGateDeps = {
  getInstalledVersion: () => Constants.expoConfig?.version ?? "0.0.0",
  checkVersion: (installedVersion) => versionApi.checkVersion(installedVersion),
  getActiveDuty: () => dutyStorage.getActiveDuty(),
};

export async function loadVersionGateState(deps: VersionGateDeps = defaultDeps): Promise<void> {
  const [versionResult, activeDuty] = await Promise.all([
    deps.checkVersion(deps.getInstalledVersion()).catch(() => null),
    deps.getActiveDuty().catch(() => null),
  ]);
  useVersionStore.getState().setHadActiveDutyAtLaunch(activeDuty !== null);
  // Fail safe: a failed/unreachable version check must never brick a
  // working app -- forceUpdateRequired simply stays at its default false.
  if (versionResult) useVersionStore.getState().setVersionCheck(versionResult);
}
