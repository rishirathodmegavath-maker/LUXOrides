import { useEffect, useState } from "react";
import * as Location from "expo-location";
import type { DutyMapPoint } from "../components/DutyMap";

export interface LiveDriverPosition extends DutyMapPoint {
  headingDegrees: number | null;
}

// Best-effort continuous GPS position for map display only -- never throws,
// never falls back to a fake/invented coordinate. Silently stays null if
// permission is denied or a fix fails, in which case DutyMap just shows no
// driver marker. Screens that actually submit a checkpoint to Fleetovo
// (start/end duty) still use util/location.ts's captureCurrentLocation,
// which requires permission and throws — this hook is purely cosmetic map
// framing, not the GPS snapshot sent to the backend (see
// useDutyLocationReporter for that, an independent watch).
export function useLiveDriverPosition(): LiveDriverPosition | null {
  const [position, setPosition] = useState<LiveDriverPosition | null>(null);

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted || cancelled) return;

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
          (pos) => {
            if (cancelled) return;
            setPosition({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              headingDegrees: pos.coords.heading,
            });
          }
        );
      } catch {
        // Best-effort only.
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return position;
}
