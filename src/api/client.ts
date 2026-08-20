import { env } from "../config/env";
import { authStorage } from "../storage/authStorage";
import type { ApiErrorBody } from "./driver.types";
import { ApiError, NetworkError } from "./errors";

async function parseError(res: Response): Promise<never> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // Non-JSON error body (e.g. a proxy/gateway error) — fall through to a synthetic one.
  }

  if (body?.code) {
    throw new ApiError(body);
  }

  throw new ApiError({
    code: "UNKNOWN_ERROR",
    message: `Request failed with status ${res.status}`,
    status: res.status,
    path: res.url,
    method: "",
    timestamp: new Date().toISOString(),
    traceId: "",
    technicalMessage: null,
    exceptionType: null,
    metadata: null,
  });
}

async function request<T>(path: string, init: RequestInit, authenticated: boolean): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const token = await authStorage.getToken();
    if (!token) {
      throw new ApiError({
        code: "NOT_AUTHENTICATED",
        message: "You're not logged in.",
        status: 401,
        path,
        method: init.method ?? "GET",
        timestamp: new Date().toISOString(),
        traceId: "",
        technicalMessage: null,
        exceptionType: null,
        metadata: null,
      });
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, { ...init, headers });
  } catch (cause) {
    throw new NetworkError(cause);
  }

  if (!res.ok) {
    await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** For endpoints under the blanket-permitAll /auth/** prefix (no Bearer token yet). */
export const publicApi = {
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }, false),
};

/** For endpoints requiring the driver's own Bearer JWT. */
export const privateApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }, true),
};
