import { useEffect } from "react";
import * as Location from "expo-location";
import { useDutyStore } from "../store/dutyStore";
import { dutyApi } from "../api/duty.api";
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from "../tasks/backgroundLocationTask";

// Reports real GPS fixes to the backend's live-location channel while a duty
// execution token is active and the duty hasn't ended yet. Independent of
// useLiveDriverPosition (which only drives the on-screen map) -- this hook
// exists purely to feed the customer app's live map, never to render
// anything locally.
//
// Prefers background-capable tracking (backgroundLocationTask) so reporting
// survives the app being backgrounded or (on Android) killed outright.
// Falls back to a foreground-only watch when background permission is
// unavailable/denied -- a driver who declines "Allow all the time" still
// gets real reporting whenever the app is actually open, rather than none
// at all. Never fabricates a fix either way.
export function useDutyLocationReporter(): void {
  const executionToken = useDutyStore((s) => s.executionToken);
  const dutyEndResult = useDutyStore((s) => s.dutyEndResult);
  const active = executionToken !== null && dutyEndResult === null;

  useEffect(() => {
    let cancelled = false;
    let foregroundSubscription: Location.LocationSubscription | null = null;

    (async () => {
      if (!active || !executionToken) {
        // Defensive: also covers a background task left running from a
        // prior session (e.g. the app was killed before duty state could
        // be cleared normally) being stopped on the next mount.
        await stopBackgroundLocationTracking().catch(() => {});
        return;
      }

      const result = await startBackgroundLocationTracking();
      if (cancelled || result !== "foreground-only") {
        // "granted": the background task now reports on its own.
        // "denied": no location permission at all -- best-effort, nothing more to do.
        return;
      }

      try {
        foregroundSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 25 },
          (pos) => {
            dutyApi
              .reportLocation(executionToken, {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracyMeters: pos.coords.accuracy,
                headingDegrees: pos.coords.heading,
                speedMps: pos.coords.speed,
                capturedAt: new Date(pos.timestamp).toISOString(),
              })
              .catch(() => {
                // Best-effort -- a dropped ping just means a stale dot on the customer's map.
              });
          }
        );
      } catch {
        // Best-effort only -- e.g. permission denied mid-flow.
      }
    })();

    return () => {
      cancelled = true;
      foregroundSubscription?.remove();
      if (active) {
        stopBackgroundLocationTracking().catch(() => {});
      }
    };
  }, [active, executionToken]);
}
