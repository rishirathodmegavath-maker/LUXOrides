export type GpsQuality = "good" | "weak" | "stale" | "unavailable";

export interface GpsFix {
  accuracyMeters: number | null;
  capturedAtMs: number;
}

// Typical open-sky smartphone GPS fix is well under 20m; 50m comfortably
// covers normal urban/light-cover conditions without flagging routine
// noise as "weak". Anything looser than that is still a real, usable fix
// (cell/wifi-assisted estimate, indoors near a window) -- just not precise
// enough to call "good".
export const ACCURACY_GOOD_METERS = 50;

// The background task reports every 20s and the foreground-only fallback
// every 15s (see backgroundLocationTask.ts / useDutyLocationReporter.ts).
// A fix older than 3x the slower of those cadences means at least two
// consecutive reporting cycles produced nothing -- a real interruption,
// not just being slightly behind the fastest cadence.
export const STALE_AFTER_MS = 60_000;

// Cold GPS acquisition can genuinely take under a minute after tracking
// starts (first fix indoors, cold almanac, etc.) -- treating "no fix yet"
// as "unavailable" before this grace period would alarm the driver on
// every ordinary duty start.
export const STARTUP_GRACE_MS = 45_000;

/**
 * Pure derivation, no I/O -- easy to test exhaustively and reused by both
 * the live hook and its tests.
 */
export function deriveGpsQuality(fix: GpsFix | null, activeSinceMs: number | null, nowMs: number): GpsQuality {
  if (fix) {
    if (nowMs - fix.capturedAtMs > STALE_AFTER_MS) return "stale";
    if (fix.accuracyMeters == null) return "good";
    if (fix.accuracyMeters <= ACCURACY_GOOD_METERS) return "good";
    return "weak";
  }
  if (activeSinceMs != null && nowMs - activeSinceMs > STARTUP_GRACE_MS) return "unavailable";
  return "good";
}
