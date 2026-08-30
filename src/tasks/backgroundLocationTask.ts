import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { dutyApi } from "../api/duty.api";
import { dutyStorage } from "../storage/dutyStorage";

/*
 * Real background-capable location reporting for an active duty. Unlike
 * useLiveDriverPosition (foreground-only, purely cosmetic map framing),
 * this task keeps reporting real GPS fixes to Fleetovo's live-location
 * channel (dutyApi.reportLocation) whether the app is foregrounded,
 * backgrounded, or (on Android) the JS engine was headlessly relaunched
 * just to run this task after the app was swiped away.
 *
 * Must be defined at module scope, reachable from index.ts's synchronous
 * import graph -- Android can invoke this task without ever mounting
 * App.tsx, so defineTask cannot live inside a component/hook.
 */
export const BACKGROUND_LOCATION_TASK = "luxorides-background-duty-location";

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    return;
  }

  const { locations } = (data as { locations?: Location.LocationObject[] }) ?? {};
  const fix = locations?.[locations.length - 1];
  if (!fix) {
    return;
  }

  // The execution token lives in SecureStore (dutyStorage), not the Zustand
  // store -- a headless background relaunch never runs App.tsx, so
  // in-memory state doesn't exist to read from. If nothing is persisted,
  // there is no duty to report against; stop ourselves defensively rather
  // than keep draining battery for no reason.
  const active = await dutyStorage.getActiveDuty();
  if (!active?.executionToken) {
    await stopBackgroundLocationTracking();
    return;
  }

  try {
    await dutyApi.reportLocation(active.executionToken, {
      latitude: fix.coords.latitude,
      longitude: fix.coords.longitude,
      accuracyMeters: fix.coords.accuracy,
      headingDegrees: fix.coords.heading,
      speedMps: fix.coords.speed,
      capturedAt: new Date(fix.timestamp).toISOString(),
    });
  } catch {
    // Best-effort -- a dropped ping just means a stale dot on the customer's map.
  }
});

export type BackgroundLocationPermissionResult = "granted" | "foreground-only" | "denied";

/**
 * Requests permission and starts background-capable tracking. Android
 * requires foreground permission to be granted before background can even
 * be requested (a system restriction, not an expo-location quirk). Returns
 * "foreground-only" rather than throwing when background is unavailable/
 * denied, so callers can fall back to foreground-only reporting instead of
 * losing location entirely.
 */
export async function startBackgroundLocationTracking(): Promise<BackgroundLocationPermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    return "denied";
  }

  const background = await Location.requestBackgroundPermissionsAsync().catch(() => null);
  if (!background?.granted) {
    return "foreground-only";
  }

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
  if (alreadyRunning) {
    return "granted";
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    // Battery-conscious cadence for a background loop -- deliberately looser
    // than useLiveDriverPosition's foreground map-framing watch (5s/10m).
    timeInterval: 20000,
    distanceInterval: 30,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "LuxoRides Chauffeur",
      notificationBody: "Sharing your location for an active duty",
      notificationColor: "#003142",
    },
  });

  return "granted";
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
  if (alreadyRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export async function isBackgroundLocationTrackingActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
}
