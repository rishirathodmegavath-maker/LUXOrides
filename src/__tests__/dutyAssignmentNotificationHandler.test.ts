import {
  createNotificationReceivedHandler,
  createNotificationTapHandler,
  type DutyAssignmentNavigation,
} from "../services/notifications/dutyAssignmentNotificationHandler";
import type { DutySummary } from "../services/types";

// P2 dispatch-discovery coverage: a notification is only ever a wake/inform
// signal. These handlers take no notification payload argument at all --
// there is nothing for a forged/stale/delayed payload to be trusted for --
// every decision comes from a fresh authoritative getTodayDuty() call.

function duty(overrides: Partial<DutySummary> = {}): DutySummary {
  return {
    id: "duty-1",
    type: "AIRPORT",
    reportTime: "10:00",
    durationLabel: "1 hr",
    pickup: { label: "PICKUP", address: "Pickup", distanceKm: null, etaMinutes: null },
    dropoff: { label: "DROP OFF", address: "Dropoff", distanceKm: null, etaMinutes: null },
    clientName: "Test Client",
    clientPhone: null,
    driverAcceptedAt: null,
    ...overrides,
  };
}

function mockNavigation(): jest.Mocked<DutyAssignmentNavigation> {
  return {
    isReady: jest.fn(() => true),
    navigateToAcceptDuty: jest.fn(),
    navigateToHome: jest.fn(),
  };
}

describe("createNotificationReceivedHandler (foreground receipt)", () => {
  test("refetches and updates the store, but never navigates -- receipt alone is not actionable", () => {
    const getTodayDuty = jest.fn().mockResolvedValue(duty());
    const setTodayDuty = jest.fn();

    const handleReceived = createNotificationReceivedHandler({ getTodayDuty, setTodayDuty });
    handleReceived();

    expect(getTodayDuty).toHaveBeenCalledTimes(1);
    return Promise.resolve().then(() => {
      expect(setTodayDuty).toHaveBeenCalledWith(expect.objectContaining({ id: "duty-1" }));
    });
  });

  test("a refetch failure on receipt never throws", () => {
    const getTodayDuty = jest.fn().mockRejectedValue(new Error("Network request failed"));
    const setTodayDuty = jest.fn();

    expect(() => createNotificationReceivedHandler({ getTodayDuty, setTodayDuty })()).not.toThrow();
  });
});

describe("createNotificationTapHandler", () => {
  test("a newly assigned, not-yet-accepted duty surfaces AcceptDuty -- never an execution screen", async () => {
    const getTodayDuty = jest.fn().mockResolvedValue(duty({ driverAcceptedAt: null }));
    const setTodayDuty = jest.fn();
    const navigation = mockNavigation();

    await createNotificationTapHandler({ getTodayDuty, setTodayDuty, navigation })();

    expect(setTodayDuty).toHaveBeenCalledWith(expect.objectContaining({ driverAcceptedAt: null }));
    expect(navigation.navigateToAcceptDuty).toHaveBeenCalledTimes(1);
    expect(navigation.navigateToHome).not.toHaveBeenCalled();
  });

  test("an already-accepted/in-progress duty lands on Home, not back into AcceptDuty", async () => {
    const getTodayDuty = jest.fn().mockResolvedValue(duty({ driverAcceptedAt: "2026-01-10T10:00:00Z" }));
    const setTodayDuty = jest.fn();
    const navigation = mockNavigation();

    await createNotificationTapHandler({ getTodayDuty, setTodayDuty, navigation })();

    expect(navigation.navigateToHome).toHaveBeenCalledTimes(1);
    expect(navigation.navigateToAcceptDuty).not.toHaveBeenCalled();
  });

  test("reassigned-before-tap: the driver no longer owns any duty, so the stale notification cannot expose it", async () => {
    // Simulates Driver A's notification arriving, then Fleetovo reassigning
    // the duty to Driver B before Driver A taps -- getTodayDuty (scoped to
    // the authenticated driver) now legitimately returns null for Driver A.
    const getTodayDuty = jest.fn().mockResolvedValue(null);
    const setTodayDuty = jest.fn();
    const navigation = mockNavigation();

    await createNotificationTapHandler({ getTodayDuty, setTodayDuty, navigation })();

    expect(setTodayDuty).toHaveBeenCalledWith(null);
    expect(navigation.navigateToAcceptDuty).not.toHaveBeenCalled();
    expect(navigation.navigateToHome).toHaveBeenCalledTimes(1);
  });

  test("does nothing if navigation isn't ready yet -- no crash, no stale navigate() call", async () => {
    const getTodayDuty = jest.fn().mockResolvedValue(duty());
    const setTodayDuty = jest.fn();
    const navigation = mockNavigation();
    navigation.isReady.mockReturnValue(false);

    await createNotificationTapHandler({ getTodayDuty, setTodayDuty, navigation })();

    expect(setTodayDuty).toHaveBeenCalled();
    expect(navigation.navigateToAcceptDuty).not.toHaveBeenCalled();
    expect(navigation.navigateToHome).not.toHaveBeenCalled();
  });

  test("a refetch failure on tap never throws and never navigates", async () => {
    const getTodayDuty = jest.fn().mockRejectedValue(new Error("Network request failed"));
    const setTodayDuty = jest.fn();
    const navigation = mockNavigation();

    await expect(createNotificationTapHandler({ getTodayDuty, setTodayDuty, navigation })()).resolves.toBeUndefined();
    expect(navigation.navigateToAcceptDuty).not.toHaveBeenCalled();
    expect(navigation.navigateToHome).not.toHaveBeenCalled();
  });

  test("duplicate/rapid taps cause at most one navigation transition, even though each may refetch", async () => {
    let resolveFetch: (d: DutySummary) => void = () => {};
    const getTodayDuty = jest.fn().mockImplementation(
      () => new Promise<DutySummary>((resolve) => { resolveFetch = resolve; })
    );
    const setTodayDuty = jest.fn();
    const navigation = mockNavigation();

    const handleTap = createNotificationTapHandler({ getTodayDuty, setTodayDuty, navigation });

    // Two taps arrive before the first fetch resolves (e.g. a duplicate
    // notification delivery) -- the second must be a no-op, not a second
    // in-flight reconciliation racing the first.
    const first = handleTap();
    const second = handleTap();
    resolveFetch(duty({ driverAcceptedAt: null }));
    await Promise.all([first, second]);

    expect(getTodayDuty).toHaveBeenCalledTimes(1);
    expect(navigation.navigateToAcceptDuty).toHaveBeenCalledTimes(1);

    // Once the first tap's handling has fully finished, a later, genuinely
    // separate tap is allowed to run again (not permanently locked out).
    // Deliberately not awaited to completion -- calling getTodayDuty()
    // happens synchronously up to the handler's own await point, which is
    // enough to prove re-entrancy is allowed; a mock that never resolves a
    // third time (this test's fetch mock resolves only once) would hang
    // forever if awaited here.
    void handleTap();
    expect(getTodayDuty).toHaveBeenCalledTimes(2);
  });
});
