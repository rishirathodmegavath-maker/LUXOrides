// Expo inlines EXPO_PUBLIC_* vars from .env at bundle time. Fails loudly at
// import time if a required value is missing rather than silently falling
// back to a guessed localhost URL, which on a physical device just points
// at the phone itself.
function required(value: string | undefined, name: string): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env and set it.`);
  }
  return value;
}

const apiBaseUrl = required(process.env.EXPO_PUBLIC_API_BASE_URL, "EXPO_PUBLIC_API_BASE_URL");

export const env = {
  apiBaseUrl,
  orgId: required(process.env.EXPO_PUBLIC_ORG_ID, "EXPO_PUBLIC_ORG_ID"),
  // Derived so it can never drift from apiBaseUrl -- http(s) -> ws(s), same host.
  wsBaseUrl: apiBaseUrl.replace(/^http/, "ws"),
};
