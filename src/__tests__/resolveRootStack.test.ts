import { resolveRootStack, type RootStackGateState } from "../navigation/resolveRootStack";

// The safety-critical rule item 4 (force-update) hinges on: a driver
// already mid-duty at launch must never be pulled out of it by a version
// check, but every other combination (no session, permissions, onboarding)
// must behave exactly as it already did before this feature existed.

function state(overrides: Partial<RootStackGateState> = {}): RootStackGateState {
  return {
    session: null,
    permissionsDone: false,
    approvalStatus: "pending",
    forceUpdateRequired: false,
    hadActiveDutyAtLaunch: false,
    ...overrides,
  };
}

describe("resolveRootStack -- force-update takes priority", () => {
  test("forceUpdateRequired with no active duty at launch -> update-required, even before login", () => {
    expect(resolveRootStack(state({ forceUpdateRequired: true, session: null }))).toBe("update-required");
  });

  test("forceUpdateRequired with no active duty, fully approved driver -> still update-required", () => {
    expect(
      resolveRootStack(
        state({ forceUpdateRequired: true, session: { driverId: "d1" }, permissionsDone: true, approvalStatus: "approved" })
      )
    ).toBe("update-required");
  });

  test("forceUpdateRequired but a duty WAS active at launch -> never shown, falls through to the normal gate", () => {
    expect(
      resolveRootStack(
        state({
          forceUpdateRequired: true,
          hadActiveDutyAtLaunch: true,
          session: { driverId: "d1" },
          permissionsDone: true,
          approvalStatus: "approved",
        })
      )
    ).toBe("main");
  });

  test("forceUpdateRequired + active duty + not logged in -> falls through to auth, not update-required", () => {
    expect(resolveRootStack(state({ forceUpdateRequired: true, hadActiveDutyAtLaunch: true, session: null }))).toBe("auth");
  });
});

describe("resolveRootStack -- unaffected by force-update off", () => {
  test("no session -> auth", () => {
    expect(resolveRootStack(state({ session: null }))).toBe("auth");
  });

  test("session but permissions not done -> permissions", () => {
    expect(resolveRootStack(state({ session: { driverId: "d1" }, permissionsDone: false }))).toBe("permissions");
  });

  test("session + permissions but not approved -> onboarding", () => {
    expect(
      resolveRootStack(state({ session: { driverId: "d1" }, permissionsDone: true, approvalStatus: "pending" }))
    ).toBe("onboarding");
  });

  test("session + permissions + approved -> main", () => {
    expect(
      resolveRootStack(state({ session: { driverId: "d1" }, permissionsDone: true, approvalStatus: "approved" }))
    ).toBe("main");
  });
});

describe("resolveRootStack -- active duty at launch is never blocked by permissionsDone", () => {
  // Reaching Main/Duty always required permissionsDone=true first, so a
  // driver with a real active duty at launch has necessarily completed the
  // wizard before -- this is a defensive backstop for a permissionsStorage
  // read failure (which fails safe to false), not a legitimate way to skip
  // the wizard for a first-time driver.
  test("permissionsDone false but a duty WAS active at launch -> falls through past permissions to onboarding/main", () => {
    expect(
      resolveRootStack(
        state({
          session: { driverId: "d1" },
          permissionsDone: false,
          hadActiveDutyAtLaunch: true,
          approvalStatus: "approved",
        })
      )
    ).toBe("main");
  });

  test("permissionsDone false and NO active duty at launch -> still shows permissions (first-time driver unaffected)", () => {
    expect(
      resolveRootStack(
        state({ session: { driverId: "d1" }, permissionsDone: false, hadActiveDutyAtLaunch: false })
      )
    ).toBe("permissions");
  });

  test("permissionsDone false + active duty + not yet approved -> onboarding, never permissions", () => {
    expect(
      resolveRootStack(
        state({
          session: { driverId: "d1" },
          permissionsDone: false,
          hadActiveDutyAtLaunch: true,
          approvalStatus: "pending",
        })
      )
    ).toBe("onboarding");
  });
});
