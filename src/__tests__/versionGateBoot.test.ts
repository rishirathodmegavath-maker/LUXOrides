import { loadVersionGateState, type VersionGateDeps } from "../util/versionGateBoot";
import { useVersionStore } from "../store/versionStore";

// Every test here passes fully-injected deps (checkVersion/getActiveDuty),
// so the real versionApi/dutyStorage implementations are never invoked --
// mocked purely so importing versionGateBoot.ts doesn't pull in
// api/client.ts's config/env.ts, which throws at module-eval time without
// EXPO_PUBLIC_API_BASE_URL/EXPO_PUBLIC_ORG_ID set (Jest, unlike Metro,
// doesn't inline .env for us -- same issue client.getCoalescing.test.ts
// works around).
jest.mock("../api/version.api", () => ({ versionApi: { checkVersion: jest.fn() } }));
jest.mock("../storage/dutyStorage", () => ({ dutyStorage: { getActiveDuty: jest.fn() } }));

// forceUpdateRequired and hadActiveDutyAtLaunch are read together by
// resolveRootStack (see resolveRootStack.ts's hadActiveDutyAtLaunch
// exemption on the update-required gate). Before this fix they were set by
// two independently-resolving promises in App.tsx -- if the version-check
// network call resolved before the local dutyStorage read did, a driver
// genuinely mid-duty could see a flash of the Update Required screen before
// the duty check caught up. These tests lock in that both are always
// written together, from one Promise.all, regardless of which underlying
// read settles first.

function deps(overrides: Partial<VersionGateDeps> = {}): VersionGateDeps {
  return {
    getInstalledVersion: () => "1.0.0",
    checkVersion: jest.fn().mockResolvedValue({ minimumSupportedVersion: "1.0.0", latestVersion: "1.0.0", forceUpdate: false }),
    getActiveDuty: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

beforeEach(() => {
  useVersionStore.setState({ forceUpdateRequired: false, latestVersion: null, hadActiveDutyAtLaunch: false });
});

describe("loadVersionGateState -- normal outcomes", () => {
  test("supported version, no active duty -> forceUpdateRequired stays false, hadActiveDutyAtLaunch false", async () => {
    await loadVersionGateState(deps());

    expect(useVersionStore.getState().forceUpdateRequired).toBe(false);
    expect(useVersionStore.getState().hadActiveDutyAtLaunch).toBe(false);
  });

  test("unsupported version -> forceUpdateRequired true, latestVersion recorded", async () => {
    await loadVersionGateState(
      deps({
        checkVersion: jest.fn().mockResolvedValue({ minimumSupportedVersion: "2.0.0", latestVersion: "2.3.0", forceUpdate: true }),
      })
    );

    expect(useVersionStore.getState().forceUpdateRequired).toBe(true);
    expect(useVersionStore.getState().latestVersion).toBe("2.3.0");
  });
});

describe("loadVersionGateState -- active duty is resolved atomically with force-update", () => {
  test("unsupported version + a real active duty -> both flags land together, correctly", async () => {
    await loadVersionGateState(
      deps({
        checkVersion: jest.fn().mockResolvedValue({ minimumSupportedVersion: "2.0.0", latestVersion: "2.3.0", forceUpdate: true }),
        getActiveDuty: jest.fn().mockResolvedValue({ dutyId: "duty-1", executionToken: "tok-1" }),
      })
    );

    expect(useVersionStore.getState().forceUpdateRequired).toBe(true);
    expect(useVersionStore.getState().hadActiveDutyAtLaunch).toBe(true);
  });

  test("the version check resolving faster than the duty-storage read never produces an intermediate write missing the duty flag", async () => {
    let resolveDuty!: (v: { dutyId: string; executionToken: string } | null) => void;
    const slowGetActiveDuty = jest.fn(
      () => new Promise<{ dutyId: string; executionToken: string } | null>((res) => (resolveDuty = res))
    );
    const fastCheckVersion = jest
      .fn()
      .mockResolvedValue({ minimumSupportedVersion: "2.0.0", latestVersion: "2.3.0", forceUpdate: true });

    const pending = loadVersionGateState(deps({ checkVersion: fastCheckVersion, getActiveDuty: slowGetActiveDuty }));

    // The fast (version-check) half of Promise.all has had every chance to
    // settle by now, but the combined function must not have written
    // anything yet -- there is no store write at all until BOTH resolve.
    await Promise.resolve();
    await Promise.resolve();
    expect(useVersionStore.getState().forceUpdateRequired).toBe(false);

    resolveDuty({ dutyId: "duty-1", executionToken: "tok-1" });
    await pending;

    // Once it does write, forceUpdateRequired and hadActiveDutyAtLaunch
    // arrive in the same tick -- never forceUpdateRequired=true with a
    // stale hadActiveDutyAtLaunch=false.
    expect(useVersionStore.getState().forceUpdateRequired).toBe(true);
    expect(useVersionStore.getState().hadActiveDutyAtLaunch).toBe(true);
  });
});

describe("loadVersionGateState -- failure fail-safe behavior", () => {
  test("a version-check failure leaves forceUpdateRequired at its default false, without blocking the active-duty read", async () => {
    await loadVersionGateState(
      deps({
        checkVersion: jest.fn().mockRejectedValue(new Error("Network request failed")),
        getActiveDuty: jest.fn().mockResolvedValue({ dutyId: "duty-1", executionToken: "tok-1" }),
      })
    );

    expect(useVersionStore.getState().forceUpdateRequired).toBe(false);
    expect(useVersionStore.getState().latestVersion).toBeNull();
    // Active-duty recovery must remain intact even though the version
    // check itself failed.
    expect(useVersionStore.getState().hadActiveDutyAtLaunch).toBe(true);
  });

  test("a duty-storage read failure leaves hadActiveDutyAtLaunch at its default false, without blocking the version check", async () => {
    await loadVersionGateState(
      deps({
        checkVersion: jest.fn().mockResolvedValue({ minimumSupportedVersion: "2.0.0", latestVersion: "2.3.0", forceUpdate: true }),
        getActiveDuty: jest.fn().mockRejectedValue(new Error("Keychain unavailable")),
      })
    );

    expect(useVersionStore.getState().hadActiveDutyAtLaunch).toBe(false);
    expect(useVersionStore.getState().forceUpdateRequired).toBe(true);
  });

  test("both reads failing never throws and leaves both flags at their safe defaults", async () => {
    await expect(
      loadVersionGateState(
        deps({
          checkVersion: jest.fn().mockRejectedValue(new Error("Network request failed")),
          getActiveDuty: jest.fn().mockRejectedValue(new Error("Keychain unavailable")),
        })
      )
    ).resolves.toBeUndefined();

    expect(useVersionStore.getState().forceUpdateRequired).toBe(false);
    expect(useVersionStore.getState().hadActiveDutyAtLaunch).toBe(false);
  });

  test("a malformed (truthy but empty) version response never sets a truthy forceUpdateRequired", async () => {
    const emptyResponse = {} as Awaited<ReturnType<VersionGateDeps["checkVersion"]>>;
    await loadVersionGateState(
      deps({
        checkVersion: jest.fn().mockResolvedValue(emptyResponse),
      })
    );

    // JS falsy-coercion of `undefined` keeps this safe by construction --
    // this test locks in that behavior rather than assuming it silently.
    expect(useVersionStore.getState().forceUpdateRequired).toBeFalsy();
  });
});

describe("loadVersionGateState -- no unnecessary network calls", () => {
  test("checkVersion and getActiveDuty are each called exactly once per invocation", async () => {
    const checkVersion = jest.fn().mockResolvedValue({ minimumSupportedVersion: "1.0.0", latestVersion: "1.0.0", forceUpdate: false });
    const getActiveDuty = jest.fn().mockResolvedValue(null);

    await loadVersionGateState(deps({ checkVersion, getActiveDuty }));

    expect(checkVersion).toHaveBeenCalledTimes(1);
    expect(getActiveDuty).toHaveBeenCalledTimes(1);
  });
});
