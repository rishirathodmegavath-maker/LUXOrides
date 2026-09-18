/*
 * Phase B -- in-flight GET coalescing on privateApi.get/tokenApi.get (see
 * src/api/client.ts). Multiple screens/hooks can issue the identical GET
 * (e.g. GET /driver/app/duties/active) while one is still in flight; these
 * prove that only one network request actually fires and every caller gets
 * the right result, without becoming a time-based response cache and
 * without ever leaking one driver's in-flight response to another.
 *
 * fetch is mocked with a manually-resolved Promise per call so the test
 * controls exactly when each "network request" settles -- no real timers,
 * no arbitrary waits.
 */

import { useAuthStore } from "../store/authStore";

jest.mock("../storage/authStorage", () => ({
  authStorage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authStorage } = require("../storage/authStorage");

// client.ts imports config/env.ts, which throws at module-evaluation time if
// EXPO_PUBLIC_API_BASE_URL/EXPO_PUBLIC_ORG_ID aren't set -- Jest (unlike
// Metro) doesn't inline .env for us. Same workaround env.test.ts already
// uses: set process.env before requiring, via a plain require (not a
// static import, which Babel hoists above any process.env assignment).
process.env.EXPO_PUBLIC_API_BASE_URL ??= "https://api.test.luxorides.com";
process.env.EXPO_PUBLIC_ORG_ID ??= "test-org";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { privateApi, tokenApi } = require("../api/client") as typeof import("../api/client");

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void };

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

let fetchMock: jest.Mock;

// One microtask tick per `await` this test needs to let settle before an
// assertion: request() does `await authStorage.getToken()` before ever
// calling fetch(), so a synchronous check right after issuing a `.get()`
// call would run before that await's continuation has had a chance to run.
async function flushMicrotasks(ticks = 5): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  fetchMock = jest.fn();
  jest.spyOn(globalThis, "fetch").mockImplementation(fetchMock as unknown as typeof fetch);
  (authStorage.getToken as jest.Mock).mockResolvedValue("driver-a-token");
  useAuthStore.setState({ session: { driverId: "driver-a", phone: "+910000000000", isNewUser: false } });
});

afterEach(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null });
});

describe("GET coalescing -- concurrent identical requests", () => {
  test("two simultaneous identical GETs produce one network request, both callers get the result", async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValue(d.promise);

    const p1 = privateApi.get<{ id: string }>("/driver/app/duties/active");
    const p2 = privateApi.get<{ id: string }>("/driver/app/duties/active");

    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    d.resolve(jsonResponse({ id: "duty-1" }));
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual({ id: "duty-1" });
    expect(r2).toEqual({ id: "duty-1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("three simultaneous identical GETs produce one network request", async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValue(d.promise);

    const p1 = privateApi.get("/driver/app/duties/active");
    const p2 = privateApi.get("/driver/app/duties/active");
    const p3 = privateApi.get("/driver/app/duties/active");

    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    d.resolve(jsonResponse({ id: "duty-1" }));
    await Promise.all([p1, p2, p3]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("different GET paths are never coalesced", async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "duty-1" })))
      .mockReturnValueOnce(Promise.resolve(jsonResponse([])));

    await Promise.all([privateApi.get("/driver/app/duties/active"), privateApi.get("/driver/app/duties/history")]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("same path shape with different embedded parameters are never coalesced", async () => {
    // This client bakes parameters into the path itself (template literals,
    // no separate query-string layer) -- so "different query params" means
    // a different path string, e.g. a different duty id.
    fetchMock
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "duty-1" })))
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "duty-2" })));

    await Promise.all([privateApi.get("/driver/app/duties/duty-1"), privateApi.get("/driver/app/duties/duty-2")]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("different authentication contexts are never incorrectly shared", async () => {
    const dA = deferred<Response>();
    const dB = deferred<Response>();
    fetchMock.mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise);

    // Driver A's request starts first, still in flight.
    (authStorage.getToken as jest.Mock).mockResolvedValue("driver-a-token");
    useAuthStore.setState({ session: { driverId: "driver-a", phone: "+910000000000", isNewUser: false } });
    const pA = privateApi.get<{ owner: string }>("/driver/app/duties/active");

    // Before A settles, the app switches to driver B, who issues the identical GET.
    (authStorage.getToken as jest.Mock).mockResolvedValue("driver-b-token");
    useAuthStore.setState({ session: { driverId: "driver-b", phone: "+910000000001", isNewUser: false } });
    const pB = privateApi.get<{ owner: string }>("/driver/app/duties/active");

    // Two distinct drivers -> two real network requests, not one shared Promise.
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    dA.resolve(jsonResponse({ owner: "driver-a" }));
    dB.resolve(jsonResponse({ owner: "driver-b" }));

    const [resultA, resultB] = await Promise.all([pA, pB]);
    expect(resultA).toEqual({ owner: "driver-a" });
    expect(resultB).toEqual({ owner: "driver-b" });
  });

  test("tokenApi requests carry their own credential in the path, so different duty tokens are never shared", async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "d1" })))
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "d2" })));

    await Promise.all([tokenApi.get("/driver-api/duty/token-a"), tokenApi.get("/driver-api/duty/token-b")]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("GET coalescing -- settlement and cleanup", () => {
  test("on success, the in-flight entry is removed so a later GET hits the network again", async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "duty-1" })))
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "duty-1-refreshed" })));

    const first = await privateApi.get<{ id: string }>("/driver/app/duties/active");
    expect(first).toEqual({ id: "duty-1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await privateApi.get<{ id: string }>("/driver/app/duties/active");
    expect(second).toEqual({ id: "duty-1-refreshed" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("on failure, the in-flight entry is removed -- all concurrent callers reject, and a later GET retries fresh", async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ code: "SERVER_ERROR", message: "boom" }, false, 500)))
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ id: "duty-1" })));

    const p1 = privateApi.get("/driver/app/duties/active");
    const p2 = privateApi.get("/driver/app/duties/active");

    await expect(p1).rejects.toThrow();
    await expect(p2).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // A later request after the failure must not be permanently blocked / must retry.
    const retried = await privateApi.get<{ id: string }>("/driver/app/duties/active");
    expect(retried).toEqual({ id: "duty-1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("GET coalescing -- non-GET verbs are never coalesced", () => {
  test("POST always fires its own network request, even for identical concurrent calls", async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ ok: true })))
      .mockReturnValueOnce(Promise.resolve(jsonResponse({ ok: true })));

    await Promise.all([
      privateApi.post("/driver/app/duties/duty-1/start", { at: "now" }),
      privateApi.post("/driver/app/duties/duty-1/start", { at: "now" }),
    ]);

    // Two identical POSTs -> two real network requests. POST has side
    // effects and must never share an in-flight Promise with another call --
    // coalescing in this client is applied only inside coalescedGet(),
    // which only privateApi.get/tokenApi.get route through; post/
    // postMultipart call request() directly and are structurally unable to
    // hit the coalescing map. This same client has no PUT/PATCH/DELETE
    // helpers (grep-verified across the codebase) -- there is nothing to
    // add a test for there beyond this structural guarantee, which applies
    // identically to any verb that isn't GET.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
