import { permissionsStorage } from "../storage/permissionsStorage";

// Confirmed bug this locks in the fix for: permissionsDone was never
// persisted anywhere, so a cold app restart always reset it to false and
// re-showed the permission wizard to a driver who had already completed it.
// SecureStore is used here (not a new persistence library) because it's
// already the app's only local key-value store -- see permissionsStorage.ts.

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SecureStore = require("expo-secure-store");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("permissionsStorage", () => {
  test("getPermissionsDone reads false when nothing has ever been persisted (first-time driver)", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);

    await expect(permissionsStorage.getPermissionsDone()).resolves.toBe(false);
  });

  test("setPermissionsDone persists, and a subsequent read returns true -- the actual cold-restart round trip", async () => {
    await permissionsStorage.setPermissionsDone();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("luxorides_permissions_done", "true");

    SecureStore.getItemAsync.mockResolvedValueOnce("true");
    await expect(permissionsStorage.getPermissionsDone()).resolves.toBe(true);
  });

  test("a storage read failure fails safe to false, never throws, never falsely marks complete", async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error("Keychain unavailable"));

    await expect(permissionsStorage.getPermissionsDone()).resolves.toBe(false);
  });

  test("an unrelated stored value never reads as done", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("something-unexpected");

    await expect(permissionsStorage.getPermissionsDone()).resolves.toBe(false);
  });
});
