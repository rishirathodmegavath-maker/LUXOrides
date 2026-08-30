import { useEffect, useState } from "react";
import { dutyService } from "../services";
import type { DutyLegRoute, DutyRouteLeg } from "../services/types";

const UNAVAILABLE: DutyLegRoute = {
  available: false,
  distanceKm: null,
  durationSeconds: null,
  routeAvailable: false,
  fromLocation: null,
  toLocation: null,
  geometry: null,
};

// Fetches the real backend route for one garage-to-garage leg once per
// screen mount (see ExternalDriverDutyController's /route/{leg}). Never
// fabricates: while loading or on failure, callers get the same explicit
// "unavailable" shape a real backend response would return for a leg with
// no waypoint/geo data, not a guessed number.
export function useDutyRoute(leg: DutyRouteLeg): { route: DutyLegRoute; loading: boolean } {
  const [route, setRoute] = useState<DutyLegRoute>(UNAVAILABLE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    dutyService
      .getRouteForLeg(leg)
      .then((r) => {
        if (!cancelled) setRoute(r);
      })
      .catch(() => {
        if (!cancelled) setRoute(UNAVAILABLE);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leg]);

  return { route, loading };
}
