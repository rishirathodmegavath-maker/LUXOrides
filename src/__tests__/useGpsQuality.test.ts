import { act, renderHook } from "@testing-library/react-native";
import { useGpsQuality } from "../hooks/useGpsQuality";
import { useGpsQualityStore } from "../store/gpsQualityStore";
import { STALE_AFTER_MS } from "../util/gpsQuality";

// Proves the hook actually reflects real fixes recorded by
// useDutyLocationReporter/backgroundLocationTask (via the shared store),
// and that staleness is re-evaluated over time -- not just frozen at
// whatever quality the last fix happened to have.
//
// `act` is async in this RNTL version (like render/renderHook/fireEvent
// elsewhere in this suite) -- an un-awaited call doesn't reliably flush the
// resulting state update before the next assertion reads result.current.

beforeEach(() => {
  useGpsQualityStore.setState({ lastFix: null, activeSinceMs: null });
});

describe("useGpsQuality -- gating", () => {
  test("reports 'good' and never marks active/records anything while tracking isn't running", async () => {
    const { result } = await renderHook(() => useGpsQuality(false));
    expect(result.current).toBe("good");
    expect(useGpsQualityStore.getState().activeSinceMs).toBeNull();
  });
});

describe("useGpsQuality -- reactivity to real fixes", () => {
  test("reflects a good fix recorded elsewhere (e.g. the background task) without a second GPS subscription", async () => {
    const { result } = await renderHook(() => useGpsQuality(true));
    expect(result.current).toBe("good");

    await act(async () => {
      useGpsQualityStore.getState().recordFix({ accuracyMeters: 12, capturedAtMs: Date.now() });
    });

    expect(result.current).toBe("good");
  });

  test("reflects a weak fix", async () => {
    const { result } = await renderHook(() => useGpsQuality(true));

    await act(async () => {
      useGpsQualityStore.getState().recordFix({ accuracyMeters: 500, capturedAtMs: Date.now() });
    });

    expect(result.current).toBe("weak");
  });
});

describe("useGpsQuality -- staleness over time, no alert spam", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("a good fix that stops arriving is reclassified stale once enough time passes -- proving the periodic recheck (not just alerting once per fix)", async () => {
    const { result } = await renderHook(() => useGpsQuality(true));

    await act(async () => {
      useGpsQualityStore.getState().recordFix({ accuracyMeters: 10, capturedAtMs: Date.now() });
    });
    expect(result.current).toBe("good");

    await act(async () => {
      jest.advanceTimersByTime(STALE_AFTER_MS + 15_000);
    });

    expect(result.current).toBe("stale");
  });

  test("recovers to good once a fresh fix arrives again -- not permanently stuck stale", async () => {
    const { result } = await renderHook(() => useGpsQuality(true));

    await act(async () => {
      useGpsQualityStore.getState().recordFix({ accuracyMeters: 10, capturedAtMs: Date.now() });
      jest.advanceTimersByTime(STALE_AFTER_MS + 15_000);
    });
    expect(result.current).toBe("stale");

    await act(async () => {
      useGpsQualityStore.getState().recordFix({ accuracyMeters: 10, capturedAtMs: Date.now() });
    });

    expect(result.current).toBe("good");
  });

  test("switching to inactive resets tracking state so a stale reading doesn't leak into the next duty", async () => {
    const { result, rerender } = await renderHook(({ active }: { active: boolean }) => useGpsQuality(active), {
      initialProps: { active: true },
    });

    await act(async () => {
      useGpsQualityStore.getState().recordFix({ accuracyMeters: 10, capturedAtMs: Date.now() });
      jest.advanceTimersByTime(STALE_AFTER_MS + 15_000);
    });
    expect(result.current).toBe("stale");

    await act(async () => {
      rerender({ active: false });
    });

    expect(result.current).toBe("good");
    expect(useGpsQualityStore.getState().lastFix).toBeNull();
  });
});
