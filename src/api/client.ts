import { env } from "../config/env";
import { authStorage } from "../storage/authStorage";
import { useAuthStore } from "../store/authStore";
import type { ApiErrorBody } from "./driver.types";
import { ApiError, NetworkError } from "./errors";

// Centralized session-expiry handling: any 401 on a Bearer-authenticated
// (privateApi) call means the driver's JWT is gone/invalid, so clear it and
// drop useAuthStore's session — RootNavigator already swaps to the Auth
// stack the moment session goes null, so this alone redirects to login with
// no per-screen handling needed. Never applied to tokenApi calls: those
// don't send a Bearer header at all (the duty token in the URL is its own,
// unrelated credential), so a 401 there says nothing about the driver's session.
async function handleUnauthorized(): Promise<void> {
  await authStorage.clearToken();
  if (useAuthStore.getState().session !== null) {
    useAuthStore.getState().setSession(null);
  }
}

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
  // FormData bodies need fetch to set their own multipart boundary header —
  // forcing application/json here would break the /driver-api/duty/*
  // multipart submissions.
  if (init.body !== undefined && !(init.body instanceof FormData)) {
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
    if (authenticated && res.status === 401) {
      await handleUnauthorized();
    }
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

export interface FilePart {
  uri: string;
  name: string;
  type: string;
}

// @RequestPart binds this part via Jackson, which requires an explicit
// application/json content-type on the part itself — React Native's
// FormData supports that via the {string, type} form (not a browser Blob,
// but RN's own documented FormData extension).
function buildMultipartForm(payload: unknown, files: Record<string, FilePart | FilePart[]>): FormData {
  const form = new FormData();
  // Omit the "payload" part entirely for file-only endpoints (payload
  // undefined) -- the backend has no @RequestPart("payload") to bind in
  // that case, and JSON.stringify(undefined) isn't a valid part body.
  if (payload !== undefined) {
    form.append("payload", { string: JSON.stringify(payload), type: "application/json" } as unknown as string);
  }
  for (const [key, value] of Object.entries(files)) {
    const parts = Array.isArray(value) ? value : [value];
    for (const part of parts) {
      form.append(key, part as unknown as Blob);
    }
  }
  return form;
}

/** For endpoints requiring the driver's own Bearer JWT. */
export const privateApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }, true),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }, true),
  postMultipart: <T>(path: string, payload: unknown, files: Record<string, FilePart | FilePart[]>) =>
    request<T>(path, { method: "POST", body: buildMultipartForm(payload, files) }, true),
};

/**
 * For the token-authenticated /driver-api/duty/{token}/** family — the
 * opaque per-duty token in the URL path IS the credential, no Bearer
 * header (see ExternalDriverDutyController, permitAll + @CrossOrigin("*")).
 */
export const tokenApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }, false),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }, false),
  postMultipart: <T>(path: string, payload: unknown, files: Record<string, FilePart | FilePart[]>) =>
    request<T>(path, { method: "POST", body: buildMultipartForm(payload, files) }, false),
};
