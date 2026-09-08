import type { DutySummary } from "../types";

/*
 * Pure(ish) notification-handling logic, factored out of App.tsx so it's
 * testable without rendering the whole app (fonts/splash/nav/auth-restore).
 * A notification is always just a wake/inform signal -- every path here
 * re-fetches GET /driver/app/duties/active (via getTodayDuty) and decides
 * from that real response, never from the notification payload. This is
 * also what makes a stale/reassigned notification safe to tap: if the duty
 * is no longer this driver's, the refetch simply won't return it.
 */

export interface DutyAssignmentNavigation {
  isReady(): boolean;
  navigateToAcceptDuty(): void;
  navigateToHome(): void;
}

interface Deps {
  getTodayDuty: () => Promise<DutySummary | null>;
  setTodayDuty: (duty: DutySummary | null) => void;
  navigation: DutyAssignmentNavigation;
}

/**
 * Foreground receipt: authoritative refetch only, never navigate -- the OS
 * banner (see pushNotifications.ts's handler config) already surfaces it.
 */
export function createNotificationReceivedHandler(deps: Pick<Deps, "getTodayDuty" | "setTodayDuty">): () => void {
  return function handleNotificationReceived(): void {
    deps.getTodayDuty().then(deps.setTodayDuty).catch(() => {});
  };
}

/**
 * Tap (foreground, backgrounded-then-opened, or killed-app cold start):
 * refetch, then land on AcceptDuty only for a genuinely new, not-yet-actioned
 * assignment -- never auto-navigate into execution screens (Pickup OTP /
 * Start / Payment / Dropoff / Completion). Guarded against re-entrancy so
 * duplicate notification events cause at most a harmless duplicate fetch,
 * never a duplicate navigation transition.
 */
export function createNotificationTapHandler(deps: Deps): () => Promise<void> {
  let handling = false;

  return async function handleNotificationTap(): Promise<void> {
    if (handling) return;
    handling = true;
    try {
      const duty = await deps.getTodayDuty();
      deps.setTodayDuty(duty);

      if (!deps.navigation.isReady()) return;

      if (duty && !duty.driverAcceptedAt) {
        deps.navigation.navigateToAcceptDuty();
      } else {
        deps.navigation.navigateToHome();
      }
    } catch {
      // Best-effort -- if the refetch itself fails, leave navigation alone;
      // the driver can still discover the duty via normal focus/reconnect.
    } finally {
      handling = false;
    }
  };
}
