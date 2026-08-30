import { env } from "../../config/env";

const MAX_BACKOFF_MS = 30000;
const AUTH_REJECT_STREAK_THRESHOLD = 3;

// Replaces the old 4s payment-status poll in PaymentQrScreen -- opens a
// WebSocket to /ws/duty-payment/{executionToken} (the raw duty token IS
// the credential here, same as the existing /driver-api/duty/{token}/**
// convention) and calls onPaid whenever the backend pushes a "paid" event.
// The caller still calls dutyService.checkPaymentStatus() once more on
// receipt for the authoritative amount/paymentId -- this only signals that
// something changed.
export function subscribeToDutyPaymentUpdates(executionToken: string, onPaid: () => void): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let neverOpenedStreak = 0;
  let stopped = false;
  let openedThisAttempt = false;

  const connect = () => {
    if (stopped) return;

    openedThisAttempt = false;
    const url = `${env.wsBaseUrl}/ws/duty-payment/${executionToken}`;
    socket = new WebSocket(url);

    socket.onopen = () => {
      openedThisAttempt = true;
      attempt = 0;
      neverOpenedStreak = 0;
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        if (payload?.paid) {
          onPaid();
        }
      } catch {
        // Ignore malformed frames -- the caller's own poll fallback covers this.
      }
    };

    socket.onclose = () => {
      if (stopped) return;

      if (!openedThisAttempt) {
        neverOpenedStreak += 1;
        if (neverOpenedStreak >= AUTH_REJECT_STREAK_THRESHOLD) {
          // The handshake itself is being rejected (expired/invalid duty
          // token) -- retrying on a timer won't help. The reconciliation
          // job on the backend still confirms payment unconditionally every
          // 7s regardless of this socket, so it's safe to just stop here.
          return;
        }
      }

      const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      socket?.close();
    };
  };

  connect();

  return () => {
    stopped = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    socket?.close();
  };
}
