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

/** For endpoints under the blanket-permitAll /auth/** and /public/** prefixes (no Bearer token). */
export const publicApi = {
  get: <T>(path: string) => coalescedGet<T>(path, false),
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

/*
 * Phase B -- in-flight GET coalescing, NOT a result cache: if a GET is
 * already in flight when an identical one is issued, the second call joins
 * the first's Promise instead of firing a second network request. The map
 * entry is removed the instant the shared request settles (success or
 * failure), so a later GET for the same thing always hits the network
 * fresh -- duty state changes too often for anything time-based here.
 *
 * Key = method + full path + auth context. Every current GET call site
 * already bakes its parameters into the path itself via template literals
 * (grep-verified: there is no separate query-string layer in this client),
 * so the path alone is the complete semantic identity of the resource for
 * every request this client makes today. Auth context is folded in
 * separately because it is NOT part of the path for privateApi: the Bearer
 * token (and the driver it identifies) is resolved from authStorage inside
 * request(), not from the URL, so two different signed-in drivers hitting
 * the same path (e.g. across a logout/login race with a request still in
 * flight) would otherwise be able to share a Promise and one driver's
 * in-flight response could be handed to another. Keying on the signed-in
 * driverId (synchronously available from useAuthStore, not the raw token)
 * makes that impossible by construction. tokenApi requests carry their own
 * credential (the opaque duty token) directly in the path already, so they
 * naturally get distinct keys without any extra auth component.
 *
 * JS's single-threaded, run-to-completion execution model means the
 * check-then-set below needs no lock/atomic primitive (unlike
 * RouteCacheService's JVM-side ConcurrentHashMap.putIfAbsent): no other
 * call can interleave between reading inFlightGets and writing to it,
 * because there is no `await` in between.
 */
const inFlightGets = new Map<string, Promise<unknown>>();

function coalesceKey(path: string, authenticated: boolean): string {
  if (!authenticated) {
    return `GET public ${path}`;
  }
  const driverId = useAuthStore.getState().session?.driverId ?? "no-session";
  return `GET auth:${driverId} ${path}`;
}

function coalescedGet<T>(path: string, authenticated: boolean): Promise<T> {
  const key = coalesceKey(path, authenticated);

  const existing = inFlightGets.get(key);
  if (existing !== undefined) {
    return existing as Promise<T>;
  }

  const tracked = request<T>(path, { method: "GET" }, authenticated).finally(() => {
    inFlightGets.delete(key);
  });
  inFlightGets.set(key, tracked);
  return tracked;
}

/** For endpoints requiring the driver's own Bearer JWT. */
export const privateApi = {
  get: <T>(path: string) => coalescedGet<T>(path, true),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }, true),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }, true),
  postMultipart: <T>(path: string, payload: unknown, files: Record<string, FilePart | FilePart[]>) =>
    request<T>(path, { method: "POST", body: buildMultipartForm(payload, files) }, true),
};

/**
 * For the token-authenticated /driver-api/duty/{token}/** family — the
 * opaque per-duty token in the URL path IS the credential, no Bearer
 * header (see ExternalDriverDutyController, permitAll + @CrossOrigin("*")).
 */
export const tokenApi = {
  get: <T>(path: string) => coalescedGet<T>(path, false),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }, false),
  postMultipart: <T>(path: string, payload: unknown, files: Record<string, FilePart | FilePart[]>) =>
    request<T>(path, { method: "POST", body: buildMultipartForm(payload, files) }, false),
};
