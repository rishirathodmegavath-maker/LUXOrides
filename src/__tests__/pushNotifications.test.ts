// P2 dispatch-discovery coverage: registration must never fire without
// permission, must never duplicate-register an unchanged token, and must
// degrade to a harmless no-op on any failure -- the app has to work exactly
// the same whether push registration succeeds, fails, or is skipped.
//
// P2C coverage: Android and iOS must acquire genuinely different token
// types (see pushNotifications.ts's top comment for why) -- Android keeps
// getDevicePushTokenAsync (a real FCM token there), iOS switches to
// getExpoPushTokenAsync (since getDevicePushTokenAsync on iOS is a raw APNs
// token the backend's Firebase-Admin path can't use).

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetDevicePushTokenAsync = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockSetNotificationHandler = jest.fn();

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  getDevicePushTokenAsync: (...args: unknown[]) => mockGetDevicePushTokenAsync(...args),
  getExpoPushTokenAsync: (...args: unknown[]) => mockGetExpoPushTokenAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  AndroidImportance: { HIGH: 4 },
}));

// A mutable OS field, mutated per-test (default "android") -- module-level
// jest.mock factories can't reference out-of-scope test variables, so the
// mock object itself is the thing tests reach back into via require().
jest.mock("react-native", () => ({ Platform: { OS: "android" } }));
// eslint-disable-next-line @typescript-eslint/no-require-imports -- mutable handle onto the mock above
const { Platform: mockPlatform } = require("react-native");

const mockProjectId = { current: "fac78157-7ef9-4b17-b3c8-c4cec13d6ceb" as string | undefined };
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { eas: { projectId: mockProjectId.current } } };
    },
  },
}));

const mockRegisterDeviceToken = jest.fn();
jest.mock("../api/notification.api", () => ({
  notificationApi: { registerDeviceToken: (...args: unknown[]) => mockRegisterDeviceToken(...args) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- required after jest.mock() above, same pattern as the other test files in this suite
const pushNotifications = require("../services/notifications/pushNotifications");
const { hasNotificationPermission, registerPushTokenIfPermitted, requestNotificationPermissionAndRegister } =
  pushNotifications;

beforeEach(() => {
  // resetAllMocks (not clearAllMocks): also drops any mockResolvedValue/
  // mockRejectedValue left behind by a previous test, e.g. the "backend
  // registration failure" test's mockRejectedValue on registerDeviceToken --
  // otherwise that rejection silently leaks into every later test's calls
  // (caught internally as best-effort), which prevents lastRegisteredToken
  // from ever updating and makes unrelated dedupe assertions fail.
  jest.resetAllMocks();
  mockPlatform.OS = "android";
  mockProjectId.current = "fac78157-7ef9-4b17-b3c8-c4cec13d6ceb";
});

describe("hasNotificationPermission", () => {
  test("reflects the real OS grant state without prompting", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    await expect(hasNotificationPermission()).resolves.toBe(true);
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe("registerPushTokenIfPermitted -- Android", () => {
  test("does nothing when permission was never granted", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: false });

    await registerPushTokenIfPermitted();

    expect(mockGetDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  test("registers the real native device token under ANDROID, never calling the Expo token API", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetDevicePushTokenAsync.mockResolvedValue({ type: "android", data: "fcm-token-abc" });

    await registerPushTokenIfPermitted();

    expect(mockRegisterDeviceToken).toHaveBeenCalledWith("fcm-token-abc", "ANDROID");
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
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

describe("registerPushTokenIfPermitted -- iOS", () => {
  beforeEach(() => {
    mockPlatform.OS = "ios";
  });

  test("uses the Expo push token API, never the raw native/APNs token API", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetExpoPushTokenAsync.mockResolvedValue({ type: "expo", data: "ExponentPushToken[abc123]" });

    await registerPushTokenIfPermitted();

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "fac78157-7ef9-4b17-b3c8-c4cec13d6ceb" });
    expect(mockGetDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).toHaveBeenCalledWith("ExponentPushToken[abc123]", "IOS");
  });

  test("missing EAS projectId: registers nothing, never throws", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockProjectId.current = undefined;

    await expect(registerPushTokenIfPermitted()).resolves.toBeUndefined();

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  test("an Expo token-fetch failure never throws -- push is always best-effort", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error("network request failed"));

    await expect(registerPushTokenIfPermitted()).resolves.toBeUndefined();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
  });

  test("skips a redundant re-registration of the same Expo token", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetExpoPushTokenAsync.mockResolvedValue({ type: "expo", data: "ExponentPushToken[dedupe-check]" });

    await registerPushTokenIfPermitted();
    await registerPushTokenIfPermitted();

    expect(mockRegisterDeviceToken).toHaveBeenCalledTimes(1);
  });

  test("token rotation: a changed Expo token value triggers a fresh registration", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockGetExpoPushTokenAsync.mockResolvedValue({ type: "expo", data: "ExponentPushToken[rotation-1]" });
    await registerPushTokenIfPermitted();

    mockGetExpoPushTokenAsync.mockResolvedValue({ type: "expo", data: "ExponentPushToken[rotation-2]" });
    await registerPushTokenIfPermitted();

    expect(mockRegisterDeviceToken).toHaveBeenCalledTimes(2);
    expect(mockRegisterDeviceToken).toHaveBeenNthCalledWith(1, "ExponentPushToken[rotation-1]", "IOS");
    expect(mockRegisterDeviceToken).toHaveBeenNthCalledWith(2, "ExponentPushToken[rotation-2]", "IOS");
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
