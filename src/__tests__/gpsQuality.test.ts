import { ACCURACY_GOOD_METERS, deriveGpsQuality, STALE_AFTER_MS, STARTUP_GRACE_MS } from "../util/gpsQuality";

const NOW = 1_700_000_000_000;

describe("deriveGpsQuality", () => {
  test("a fresh, accurate fix is good", () => {
    expect(deriveGpsQuality({ accuracyMeters: 15, capturedAtMs: NOW - 5_000 }, NOW - 60_000, NOW)).toBe("good");
  });

  test("a fresh fix with no accuracy metadata is treated as good, not penalized for missing data", () => {
    expect(deriveGpsQuality({ accuracyMeters: null, capturedAtMs: NOW - 5_000 }, NOW - 60_000, NOW)).toBe("good");
  });

  test("a fresh fix right at the good/weak accuracy boundary is still good", () => {
    expect(deriveGpsQuality({ accuracyMeters: ACCURACY_GOOD_METERS, capturedAtMs: NOW }, NOW - 60_000, NOW)).toBe("good");
  });

  test("a fresh but imprecise fix is weak, not stale or unavailable", () => {
    expect(deriveGpsQuality({ accuracyMeters: ACCURACY_GOOD_METERS + 1, capturedAtMs: NOW }, NOW - 60_000, NOW)).toBe("weak");
  });

  test("a very imprecise fix is still weak, not escalated further -- we do have a real fix", () => {
    expect(deriveGpsQuality({ accuracyMeters: 5000, capturedAtMs: NOW }, NOW - 60_000, NOW)).toBe("weak");
  });

  test("a fix older than the stale threshold is stale even if it was accurate", () => {
    expect(deriveGpsQuality({ accuracyMeters: 10, capturedAtMs: NOW - STALE_AFTER_MS - 1 }, NOW - 200_000, NOW)).toBe("stale");
  });

  test("a fix exactly at the stale threshold is not yet stale", () => {
    expect(deriveGpsQuality({ accuracyMeters: 10, capturedAtMs: NOW - STALE_AFTER_MS }, NOW - 200_000, NOW)).toBe("good");
  });

  test("no fix yet, still within the startup grace period, reads as good -- not an alarm on every duty start", () => {
    expect(deriveGpsQuality(null, NOW - (STARTUP_GRACE_MS - 1_000), NOW)).toBe("good");
  });

  test("no fix ever received, past the startup grace period, is unavailable", () => {
    expect(deriveGpsQuality(null, NOW - STARTUP_GRACE_MS - 1, NOW)).toBe("unavailable");
  });

  test("no fix and no known active-since time (tracking not even started) reads as good", () => {
    expect(deriveGpsQuality(null, null, NOW)).toBe("good");
  });
});
