import { useVersionStore } from "../store/versionStore";

beforeEach(() => {
  useVersionStore.setState({ forceUpdateRequired: false, latestVersion: null, hadActiveDutyAtLaunch: false });
});

describe("useVersionStore", () => {
  test("setVersionCheck applies both forceUpdate and latestVersion together", () => {
    useVersionStore.getState().setVersionCheck({ forceUpdate: true, latestVersion: "1.5.0" });

    expect(useVersionStore.getState().forceUpdateRequired).toBe(true);
    expect(useVersionStore.getState().latestVersion).toBe("1.5.0");
  });

  test("setHadActiveDutyAtLaunch is independent of the version-check result", () => {
    useVersionStore.getState().setHadActiveDutyAtLaunch(true);

    expect(useVersionStore.getState().hadActiveDutyAtLaunch).toBe(true);
    expect(useVersionStore.getState().forceUpdateRequired).toBe(false);
  });
});
