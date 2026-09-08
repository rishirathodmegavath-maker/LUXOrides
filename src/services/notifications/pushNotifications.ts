import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { notificationApi } from "../../api/notification.api";

/*
 * Wake/inform signal only -- see DriverDutyAssignmentNotificationListener on
 * the backend. This module never constructs duty state from a payload; every
 * receipt/tap handler that consumes it (wired in App.tsx) re-fetches
 * GET /driver/app/duties/active instead. Uses the native FCM/APNs device
 * token (getDevicePushTokenAsync), not an Expo push token -- the backend's
 * FcmPushService talks to Firebase Admin SDK directly (Message.builder()
 * .setToken(...)), which expects a real FCM registration token, not an
 * Expo-relay token.
 *
 * KNOWN LIMITATION (see final report): on iOS, getDevicePushTokenAsync()
 * returns the raw APNs token. Firebase Admin SDK's Message.builder()
 * .setToken() expects an FCM token, not a raw APNs token -- bridging the two
 * requires either the native Firebase iOS SDK (to do the on-device APNs->FCM
 * token exchange) or an APNs-direct send path on the backend, neither of
 * which exists in this repo today. Android is fully correct as implemented.
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

    const { type, data } = await Notifications.getDevicePushTokenAsync();
    if (typeof data !== "string" || !data) return;
    if (data === lastRegisteredToken) return;

    await notificationApi.registerDeviceToken(data, type === "ios" ? "IOS" : "ANDROID");
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
