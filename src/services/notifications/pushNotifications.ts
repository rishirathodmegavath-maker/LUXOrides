import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { notificationApi } from "../../api/notification.api";

/*
 * Wake/inform signal only -- see DriverDutyAssignmentNotificationListener on
 * the backend. This module never constructs duty state from a payload; every
 * receipt/tap handler that consumes it (wired in App.tsx) re-fetches
 * GET /driver/app/duties/active instead.
 *
 * PHASE 2C: platform-specific token acquisition, because the two platforms
 * need genuinely different token types for the backend's existing delivery
 * mechanisms:
 *  - Android: the native FCM/device token (getDevicePushTokenAsync) --
 *    expo-notifications' Android implementation is itself FCM-backed, so
 *    this is a real FCM registration token, exactly what the backend's
 *    Firebase Admin SDK path (PushNotificationService) already sends
 *    through unchanged, since Phase 2. Untouched by this change.
 *  - iOS: getDevicePushTokenAsync() there returns the raw APNs device
 *    token -- expo-notifications' iOS implementation is pure
 *    UIApplication/UNUserNotificationCenter, with zero Firebase SDK
 *    involvement on-device (verified by reading its native source; see
 *    final report). Firebase Admin's Message.builder().setToken() requires
 *    an FCM registration token, which a raw APNs token is not, and cannot
 *    be turned into one without either the native Firebase iOS SDK (a
 *    heavy dependency with known delegate conflicts against
 *    expo-notifications) or a backend APNs-direct sender (a second,
 *    fully-separate credential/delivery mechanism). Instead, iOS uses
 *    getExpoPushTokenAsync() -- already bundled in expo-notifications, no
 *    new native dependency -- and the backend relays Expo-shaped tokens
 *    through Expo's push service instead of Firebase Admin, auto-detected
 *    by token shape (see PushNotificationService on the backend). Android's
 *    already-correct path is untouched.
 */

// Foreground notifications should still surface an OS-level banner (the
// simplest correct "in-app notification" -- no bespoke UI needed) but never
// need a sound/badge for a single duty-assignment alert.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let lastRegisteredToken: string | null = null;

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("duty-assignments", {
    name: "Duty assignments",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Checks current permission status without prompting -- safe to call on every launch. */
export async function hasNotificationPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/**
 * iOS needs an Expo push token (see this file's top comment); Android keeps
 * using its already-correct native FCM/device token. Returns null (rather
 * than throwing) if the token can't be obtained -- callers already treat
 * this whole flow as best-effort.
 */
async function getPlatformPushToken(): Promise<string | null> {
  if (Platform.OS === "ios") {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return typeof data === "string" && data ? data : null;
  }

  const { data } = await Notifications.getDevicePushTokenAsync();
  return typeof data === "string" && data ? data : null;
}

/**
 * Registers (or re-registers) this device's push token with the backend if,
 * and only if, permission is already granted. Best-effort: the app must work
 * identically whether this succeeds, fails, or is skipped -- the existing
 * focus/reconnect reconciliation is what actually guarantees correctness,
 * never this. Skips a redundant re-registration if the token hasn't changed
 * since the last successful call in this app session.
 */
export async function registerPushTokenIfPermitted(): Promise<void> {
  try {
    const granted = await hasNotificationPermission();
    if (!granted) return;

    const data = await getPlatformPushToken();
    if (!data) return;
    if (data === lastRegisteredToken) return;

    await notificationApi.registerDeviceToken(data, Platform.OS === "ios" ? "IOS" : "ANDROID");
    lastRegisteredToken = data;
  } catch {
    // Best-effort -- push is never a precondition for the app working.
  }
}

/** Called from the notification permission step: requests OS permission, then registers on grant. */
export async function requestNotificationPermissionAndRegister(): Promise<boolean> {
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return false;
    await ensureAndroidNotificationChannel();
    await registerPushTokenIfPermitted();
    return true;
  } catch {
    return false;
  }
}
