import { useEffect, useState } from "react";
import { useGpsQualityStore } from "../store/gpsQualityStore";
import { deriveGpsQuality, type GpsQuality } from "../util/gpsQuality";

// Ticks purely locally (no network, no new GPS subscription) so a fix that
// WAS good can still be reclassified "stale" once enough time passes with
// no new fix arriving -- staleness is a function of the clock, not just of
// the last fix received. 10s keeps the driver-facing state reasonably
// current without adding meaningful battery/CPU cost.
const RECHECK_INTERVAL_MS = 10_000;

/**
 * Derives GOOD/WEAK/STALE/UNAVAILABLE from whichever fix was most recently
 * recorded into gpsQualityStore, by either useDutyLocationReporter's own
 * foreground watch or the background location task. `active` should match
 * the same "duty tracking should currently be running" condition the
 * reporter itself uses -- when false, tracking isn't expected to be
 * running at all, so quality is reported as "good" (nothing to warn about).
 */
export function useGpsQuality(active: boolean): GpsQuality {
  const [now, setNow] = useState(() => Date.now());
  const lastFix = useGpsQualityStore((s) => s.lastFix);
  const activeSinceMs = useGpsQualityStore((s) => s.activeSinceMs);
  const markActive = useGpsQualityStore((s) => s.markActive);
  const reset = useGpsQualityStore((s) => s.reset);

  useEffect(() => {
    if (!active) {
      reset();
      return;
    }
    markActive();
    // `now` is already fresh from useState's initializer at mount time --
    // no need to set it again synchronously here; the interval below keeps
    // it current from this point on.
    const id = setInterval(() => setNow(Date.now()), RECHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, markActive, reset]);

  if (!active) return "good";
  return deriveGpsQuality(lastFix, activeSinceMs, now);
}
