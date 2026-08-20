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
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }, true),
};

export interface FilePart {
  uri: string;
  name: string;
  type: string;
}

/**
 * For the token-authenticated /driver-api/duty/{token}/** family — the
 * opaque per-duty token in the URL path IS the credential, no Bearer
 * header (see ExternalDriverDutyController, permitAll + @CrossOrigin("*")).
 */
export const tokenApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }, false),
  postMultipart: <T>(path: string, payload: unknown, files: Record<string, FilePart | FilePart[]>) => {
    const form = new FormData();
    // @RequestPart binds this part via Jackson, which requires an explicit
    // application/json content-type on the part itself — React Native's
    // FormData supports that via the {string, type} form (not a browser
    // Blob, but RN's own documented FormData extension).
    form.append(
      "payload",
      { string: JSON.stringify(payload), type: "application/json" } as unknown as string
    );
    for (const [key, value] of Object.entries(files)) {
      const parts = Array.isArray(value) ? value : [value];
      for (const part of parts) {
        form.append(key, part as unknown as Blob);
      }
    }
    return request<T>(path, { method: "POST", body: form }, false);
  },
};
