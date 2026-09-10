import * as SecureStore from "expo-secure-store";

// permissionsDone records that this device has walked the permission-
// onboarding wizard to completion at least once -- not a secret, and not
// tied to any one driver account (both the underlying OS grants and this
// wizard are device-scoped, not account-scoped). SecureStore is used here
// purely because it is the only persistent local key-value store already
// wired into this app (see authStorage.ts / dutyStorage.ts) -- there is no
// AsyncStorage/MMKV usage anywhere in the codebase to reach for instead
// (the AsyncStorage package present in package.json is an unused transitive
// dependency of something else), and adding a new persistence library for a
// single boolean would be an unjustified new dependency. Kept in its own
// module, never merged into authStorage, so a session/logout clear never
// touches it -- the same reasoning as dutyStorage's separation from
// authStorage.
const PERMISSIONS_DONE_KEY = "luxorides_permissions_done";

export const permissionsStorage = {
  async getPermissionsDone(): Promise<boolean> {
    try {
      return (await SecureStore.getItemAsync(PERMISSIONS_DONE_KEY)) === "true";
    } catch {
      // Fail safe: a storage read failure must never be treated as "done" --
      // worst case the driver sees the wizard again, never a false skip.
      return false;
    }
  },
  async setPermissionsDone(): Promise<void> {
    await SecureStore.setItemAsync(PERMISSIONS_DONE_KEY, "true");
  },
};
