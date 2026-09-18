/*
 * Session-expiry handling in src/api/client.ts's request()/handleUnauthorized.
 * A 401 on a Bearer-authenticated (privateApi) call is the ONLY signal that
 * should ever clear the driver's session -- it must never fire for tokenApi
 * calls (the duty-execution token is a wholly separate credential, and a
 * 401 there says nothing about the driver's own login state), and it must
 * always clear the stored JWT together with the in-memory session so a
 * stale token is never retried.
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

process.env.EXPO_PUBLIC_API_BASE_URL ??= "https://api.test.luxorides.com";
process.env.EXPO_PUBLIC_ORG_ID ??= "test-org";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { privateApi, tokenApi } = require("../api/client") as typeof import("../api/client");

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, url: "https://api.test.luxorides.com/x", json: async () => body } as Response;
}

let fetchMock: jest.Mock;

beforeEach(() => {
  // authStorage's jest.fn()s are created once at module-mock-factory time,
  // not per test -- restoreAllMocks (afterEach) only undoes jest.spyOn
  // spies (the fetch mock below), so clearAllMocks here is what actually
  // resets their accumulated call counts between tests in this file.
  jest.clearAllMocks();
  fetchMock = jest.fn();
  jest.spyOn(globalThis, "fetch").mockImplementation(fetchMock as unknown as typeof fetch);
  (authStorage.getToken as jest.Mock).mockResolvedValue("a-jwt-that-has-expired");
  useAuthStore.setState({ session: { driverId: "driver-a", phone: "+910000000000", isNewUser: false } });
});

afterEach(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null });
});

describe("session expiry -- 401 on an authenticated (privateApi) call", () => {
  test("clears both the stored JWT and the in-memory session", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ code: "UNAUTHORIZED", message: "Token expired" }, false, 401)
    );

    await expect(privateApi.get("/driver/app/duties/active")).rejects.toThrow();

    expect(authStorage.clearToken).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session).toBeNull();
  });

  test("a 401 while there is no active duty still clears the session the same way", async () => {
    // "No active duty" here just means the call in question is a plain
    // dashboard read with nothing duty-specific about it -- the handler's
    // behavior must not depend on what was being fetched.
    fetchMock.mockResolvedValue(jsonResponse({ code: "UNAUTHORIZED", message: "Token expired" }, false, 401));

    await expect(privateApi.get("/driver/app/duties/history")).rejects.toThrow();

    expect(useAuthStore.getState().session).toBeNull();
  });

  test("a 401 while a duty IS active clears the session identically -- the driver is not left half-authenticated", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: "UNAUTHORIZED", message: "Token expired" }, false, 401));

    await expect(privateApi.get("/driver/app/duties/duty-1")).rejects.toThrow();

    expect(authStorage.clearToken).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session).toBeNull();
  });

  test("a successful re-login (setSession) after expiry restores the driver to an authenticated state", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: "UNAUTHORIZED", message: "Token expired" }, false, 401));
    await expect(privateApi.get("/driver/app/duties/active")).rejects.toThrow();
    expect(useAuthStore.getState().session).toBeNull();

    useAuthStore.getState().setSession({ driverId: "driver-a", phone: "+910000000000", isNewUser: false });

    expect(useAuthStore.getState().session).toEqual({ driverId: "driver-a", phone: "+910000000000", isNewUser: false });
  });
});

describe("session expiry -- 401 on a duty-token-authenticated (tokenApi) call", () => {
  test("never touches the driver's session -- the duty token is an unrelated credential", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ code: "INVALID_DUTY_TOKEN", message: "Token invalid or expired" }, false, 401)
    );

    await expect(tokenApi.get("/driver-api/duty/some-token")).rejects.toThrow();

    expect(authStorage.clearToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session).toEqual({ driverId: "driver-a", phone: "+910000000000", isNewUser: false });
  });
});
