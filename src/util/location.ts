import * as Location from "expo-location";

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  formattedAddress: string;
}

// Used at duty start/end where the backend requires a real GPS snapshot
// (AddressSnapshot) alongside the odometer photo. Reverse geocoding is
// best-effort — coordinates alone are a valid, accepted fallback.
export async function captureCurrentLocation(): Promise<CapturedLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Location permission is required to continue.");
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  let formattedAddress = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;

  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    if (place) {
      formattedAddress = [place.name, place.street, place.city, place.region].filter(Boolean).join(", ");
    }
  } catch {
    // Best-effort — coordinate fallback above already covers this.
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy ?? undefined,
    formattedAddress,
  };
}
