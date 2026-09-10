export type RootStackKey = "update-required" | "auth" | "permissions" | "onboarding" | "main";

export interface RootStackGateState {
  session: unknown;
  permissionsDone: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  forceUpdateRequired: boolean;
  hadActiveDutyAtLaunch: boolean;
}

/*
 * Pure decision extracted out of RootNavigator so the safety-critical
 * "a driver mid-duty must never be pulled out of it for a version check"
 * rule can be unit-tested without rendering the real navigation tree
 * (RootNavigator pulls in every child navigator -- Auth/Permissions/
 * Onboarding/Main/Duty -- which is expensive and unnecessary just to prove
 * this one branch is correct).
 */
export function resolveRootStack(state: RootStackGateState): RootStackKey {
  if (state.forceUpdateRequired && !state.hadActiveDutyAtLaunch) return "update-required";
  if (!state.session) return "auth";
  // Reaching Main/Duty at all already requires permissionsDone to have been
  // true once (this gate sits before it), so a driver with an active duty
  // at launch has necessarily completed this wizard before -- the
  // hadActiveDutyAtLaunch exemption here is a defensive backstop for a
  // permissionsStorage read failure (see permissionsStorage.ts's fail-safe
  // false), never a way to genuinely skip the wizard for a first-time
  // driver, exactly like the force-update exemption above.
  if (!state.permissionsDone && !state.hadActiveDutyAtLaunch) return "permissions";
  if (state.approvalStatus !== "approved") return "onboarding";
  return "main";
}
