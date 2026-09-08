// Expo inlines EXPO_PUBLIC_* vars from .env (or EAS's own Environment
// Variables for a given build profile/environment) at bundle time. Fails
// loudly at import time if a required value is missing rather than silently
// falling back to a guessed localhost URL, which on a physical device just
// points at the phone itself.
function required(value: string | undefined, name: string): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env and set it.`);
  }
  return value;
}

// Matches localhost/loopback/RFC1918 private-network hosts regardless of
// scheme -- exactly the kind of address a developer's .env points the app
// at (see .env.example), and exactly what a real production backend must
// never be. 172.16.0.0/12 is written out as 172.(16-31). to cover the full
// private range, a superset of the 172.16-172.18 addresses seen in past
// local configs.
const PRIVATE_HOST_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?(?:[/?#]|$)/i;

// __DEV__ is false for any release-mode JS bundle (an EAS preview or
// production build), true only when running against Metro (Expo Go / a
// development-client build) -- exactly the boundary between "a developer
// pointing this at their own machine is fine" and "this must be a real,
// public, HTTPS backend." Guards production-only checks so the existing
// local dev workflow (LAN IP, "demo" seed org) is completely unaffected.
function assertProductionSafe(apiBaseUrl: string, orgId: string): void {
  if (__DEV__) return;

  if (!apiBaseUrl.toLowerCase().startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be an HTTPS URL in a production build.");
  }
  if (PRIVATE_HOST_PATTERN.test(apiBaseUrl)) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL must not point at a localhost/private-network address in a production build."
    );
  }
  if (orgId.trim().toLowerCase() === "demo") {
    throw new Error('EXPO_PUBLIC_ORG_ID must not be "demo" in a production build.');
  }
}

const apiBaseUrl = required(process.env.EXPO_PUBLIC_API_BASE_URL, "EXPO_PUBLIC_API_BASE_URL");
const orgId = required(process.env.EXPO_PUBLIC_ORG_ID, "EXPO_PUBLIC_ORG_ID");
assertProductionSafe(apiBaseUrl, orgId);

export const env = {
  apiBaseUrl,
  orgId,
  // Derived so it can never drift from apiBaseUrl -- http(s) -> ws(s), same host.
  wsBaseUrl: apiBaseUrl.replace(/^http/, "ws"),
};
