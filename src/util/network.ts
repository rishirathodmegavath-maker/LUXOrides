import * as Network from "expo-network";

export class OfflineError extends Error {
  constructor() {
    super("This action requires an internet connection. Please reconnect and try again.");
    this.name = "OfflineError";
  }
}

/*
 * A pre-flight check for mutations the app must not blindly fire (and
 * possibly retry) while genuinely offline: start/end duty, pickup-OTP
 * verification, return-to-garage, close-duty, SOS, incident, and inspection
 * submission. Fails fast with a clear message rather than letting fetch
 * hang or surface a confusing generic network error -- consistent with "if
 * an operation cannot safely be queued, tell the driver it requires
 * connectivity" rather than fabricating an offline success or silently
 * queueing something that was never actually sent.
 *
 * Best-effort: if the connectivity check itself fails (e.g. unsupported on
 * this platform), this does not block the action -- the real fetch call is
 * still the authority on whether the request actually went through.
 */
export async function assertOnline(): Promise<void> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false || state.isInternetReachable === false) {
      throw new OfflineError();
    }
  } catch (e) {
    if (e instanceof OfflineError) throw e;
    // Check itself failed -- don't block the action on that.
  }
}
