// P2 dispatch-discovery coverage: registration must never fire without
// permission, must never duplicate-register an unchanged token, and must
// degrade to a harmless no-op on any failure -- the app has to work exactly
// the same whether push registration succeeds, fails, or is skipped.

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetDevicePushTokenAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockSetNotificationHandler = jest.fn();

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  getDevicePushTokenAsync: (...args: unknown[]) => mockGetDevicePushTokenAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock("react-native", () => ({ Platform: { OS: "android" } }));

const mockRegisterDeviceToken = jest.fn();
jest.mock("../api/notification.api", () => ({
  notificationApi: { registerDeviceToken: (...args: unknown[]) => mockRegisterDeviceToken(...args) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- required after jest.mock() above, same pattern as the other test files in this suite
const pushNotifications = require("../services/notifications/pushNotifications");
const { hasNotificationPermission, registerPushTokenIfPermitted, requestNotificationPermissionAndRegister } =
  pushNotifications;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("hasNotificationPermission", () => {
  test("reflects the real OS grant state without prompting", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    await expect(hasNotificationPermission()).resolves.toBe(true);
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe("registerPushTokenIfPermitted", () => {
  test("does nothing when permission was never granted", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: false });

    await registerPushTokenIfPermitted();

    expect(mockGetDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  test("registers the real device token under the mapped platform when granted", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetDevicePushTokenAsync.mockResolvedValue({ type: "android", data: "fcm-token-abc" });

    await registerPushTokenIfPermitted();

    expect(mockRegisterDeviceToken).toHaveBeenCalledWith("fcm-token-abc", "ANDROID");
  });

  test("skips a redundant re-registration of the same token", async () => {
    // A token value not used by any earlier test in this file -- module-level
    // dedupe state persists across tests, so reusing "fcm-token-abc" here
    // would already be considered "already registered" and prove nothing.
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetDevicePushTokenAsync.mockResolvedValue({ type: "android", data: "fcm-token-dedupe-check" });

    await registerPushTokenIfPermitted();
    await registerPushTokenIfPermitted();

    expect(mockRegisterDeviceToken).toHaveBeenCalledTimes(1);
  });

  test("a token-fetch failure never throws -- push is always best-effort", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetDevicePushTokenAsync.mockRejectedValue(new Error("native module unavailable"));

    await expect(registerPushTokenIfPermitted()).resolves.toBeUndefined();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  test("a backend registration failure never throws", async () => {
    // Deliberately a distinct token value from the "redundant re-registration"
    // test above -- module-level dedupe state persists across tests in this
    // file, and reusing a token already seen would skip the real backend
    // call this test needs to exercise.
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetDevicePushTokenAsync.mockResolvedValue({ type: "android", data: "fcm-token-failure-case" });
    mockRegisterDeviceToken.mockRejectedValue(new Error("Network request failed"));

    await expect(registerPushTokenIfPermitted()).resolves.toBeUndefined();
    expect(mockRegisterDeviceToken).toHaveBeenCalledWith("fcm-token-failure-case", "ANDROID");
  });
});

describe("requestNotificationPermissionAndRegister", () => {
  test("permission denied: returns false and never registers a token", async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ granted: false });

    const result = await requestNotificationPermissionAndRegister();

    expect(result).toBe(false);
    expect(mockGetDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  test("permission granted: registers the device token", async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetDevicePushTokenAsync.mockResolvedValue({ type: "android", data: "fcm-token-xyz" });

    const result = await requestNotificationPermissionAndRegister();

    expect(result).toBe(true);
    expect(mockRegisterDeviceToken).toHaveBeenCalledWith("fcm-token-xyz", "ANDROID");
  });
});
