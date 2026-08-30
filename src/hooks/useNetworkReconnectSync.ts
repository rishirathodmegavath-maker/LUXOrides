import { useEffect, useRef } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { reconcileActiveDuty } from "../util/resumeDuty";

// When connectivity is restored after being lost mid-session, re-fetch real
// duty state from the backend (reconcileActiveDuty already does exactly
// this for a cold app restart -- reused here, not duplicated) rather than
// leaving the app trusting whatever it last knew while offline. This
// restores executionToken/todayDuty into the store when something is
// genuinely resumable, or clears a stale reference when the backend has
// since moved past it (duty closed/cancelled elsewhere) -- HomeScreen's own
// focus effect picks up the corrected resume target the next time it's
// focused.
export function useNetworkReconnectSync(): void {
  const { isOffline } = useNetworkStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      reconcileActiveDuty().catch(() => {
        // Best-effort -- a failed reconciliation attempt just means the app
        // keeps whatever state it already had until the next opportunity
        // (next focus, next reconnect).
      });
    }
  }, [isOffline]);
}
