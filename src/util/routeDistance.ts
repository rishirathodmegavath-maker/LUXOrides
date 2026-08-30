import type { DutyMapPoint } from "../components/DutyMap";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(a: DutyMapPoint, b: DutyMapPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Distance remaining along a real route polyline (e.g. ReturnRouteEstimate.geometry),
 * from the driver's current position to the route's end. Never fabricates a
 * straight-line/as-the-crow-flies figure or an invented ETA -- this sums the
 * actual road-following segments the backend returned, starting from
 * whichever geometry point is closest to the driver right now. Returns null
 * when there's no real geometry to measure against.
 */
export function remainingDistanceKm(geometry: DutyMapPoint[] | null | undefined, driverPosition: DutyMapPoint | null): number | null {
  if (!geometry || geometry.length < 2 || !driverPosition) {
    return null;
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  for (let i = 0; i < geometry.length; i++) {
    const d = haversineKm(driverPosition, geometry[i]);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestIndex = i;
    }
  }

  let remaining = 0;
  for (let i = nearestIndex; i < geometry.length - 1; i++) {
    remaining += haversineKm(geometry[i], geometry[i + 1]);
  }

  return remaining;
}
