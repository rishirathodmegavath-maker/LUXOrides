import { scrubBreadcrumb, scrubEvent } from "../config/sentry";
import type { Breadcrumb, ErrorEvent } from "@sentry/react-native";

// Crash-reporting task -- the JWT (Authorization header) and any query
// string must never leave the device inside an HTTP breadcrumb, since
// Sentry breadcrumbs attach to every event sent afterward, not just the one
// on the request that generated them.

describe("scrubBreadcrumb", () => {
  test("redacts the Authorization header on an http breadcrumb", () => {
    const breadcrumb: Breadcrumb = {
      category: "http",
      data: { url: "https://api.example.com/driver-api/duty/today", headers: { Authorization: "Bearer secret-jwt", Accept: "application/json" } },
    };

    const result = scrubBreadcrumb(breadcrumb);

    expect((result?.data as Record<string, unknown>).headers).toEqual({
      Authorization: "[redacted]",
      Accept: "application/json",
    });
  });

  test("redacts Authorization regardless of header casing", () => {
    const breadcrumb: Breadcrumb = {
      category: "fetch",
      data: { headers: { authorization: "Bearer secret-jwt" } },
    };

    const result = scrubBreadcrumb(breadcrumb);

    expect((result?.data as Record<string, unknown>).headers).toEqual({ authorization: "[redacted]" });
  });

  test("strips the query string from the breadcrumb URL", () => {
    const breadcrumb: Breadcrumb = {
      category: "xhr",
      data: { url: "https://api.example.com/driver-api/duty/token123/pickup-otp/verify?otp=445566" },
    };

    const result = scrubBreadcrumb(breadcrumb);

    // The query string is gone AND the duty execution token itself (a
    // bearer-equivalent credential, see redactDutyToken) is redacted --
    // this URL alone, unredacted, could authenticate as this driver for
    // the rest of the duty (start/end, GPS pings, payment status, close).
    expect((result?.data as Record<string, unknown>).url).toBe(
      "https://api.example.com/driver-api/duty/[redacted]/pickup-otp/verify"
    );
  });

  test("redacts the duty execution token embedded in the URL path even with no query string", () => {
    const breadcrumb: Breadcrumb = {
      category: "http",
      data: { url: "https://api.example.com/driver-api/duty/live-token-abc/location" },
    };

    const result = scrubBreadcrumb(breadcrumb);

    expect((result?.data as Record<string, unknown>).url).toBe(
      "https://api.example.com/driver-api/duty/[redacted]/location"
    );
  });

  test("never leaks the raw token value anywhere in the scrubbed breadcrumb", () => {
    const token = "super-secret-execution-token-xyz";
    const breadcrumb: Breadcrumb = {
      category: "fetch",
      data: { url: `https://api.example.com/driver-api/duty/${token}/close` },
    };

    const result = scrubBreadcrumb(breadcrumb);

    expect(JSON.stringify(result)).not.toContain(token);
  });

  test("leaves URLs unrelated to duty-token endpoints untouched (aside from query stripping)", () => {
    const breadcrumb: Breadcrumb = {
      category: "http",
      data: { url: "https://api.example.com/driver/app/duties/active" },
    };

    const result = scrubBreadcrumb(breadcrumb);

    expect((result?.data as Record<string, unknown>).url).toBe("https://api.example.com/driver/app/duties/active");
  });

  test("leaves non-network breadcrumbs (e.g. navigation) untouched", () => {
    const breadcrumb: Breadcrumb = { category: "navigation", data: { to: "PaymentBilling" } };

    expect(scrubBreadcrumb(breadcrumb)).toEqual(breadcrumb);
  });
});

describe("scrubEvent", () => {
  test("redacts an Authorization header on the event's request context", () => {
    const event = {
      request: { headers: { Authorization: "Bearer secret-jwt", "Content-Type": "application/json" } },
    } as unknown as ErrorEvent;

    const result = scrubEvent(event);

    expect(result.request?.headers).toEqual({
      Authorization: "[redacted]",
      "Content-Type": "application/json",
    });
  });

  test("redacts the duty execution token embedded in the event's request URL", () => {
    const event = {
      request: { url: "https://api.example.com/driver-api/duty/live-token-abc/end" },
    } as unknown as ErrorEvent;

    const result = scrubEvent(event);

    expect(result.request?.url).toBe("https://api.example.com/driver-api/duty/[redacted]/end");
  });

  test("redacts a duty execution token that leaked into a thrown error's own message", () => {
    // e.g. a NetworkError/ApiError constructed with the failing request's
    // URL baked into its message text -- the token must not survive into
    // the captured exception value even when it rides along in prose,
    // not a structured field.
    const event = {
      exception: {
        values: [{ type: "Error", value: "Request to /driver-api/duty/live-token-abc/close failed" }],
      },
    } as unknown as ErrorEvent;

    const result = scrubEvent(event);

    expect(result.exception?.values?.[0].value).toBe("Request to /driver-api/duty/[redacted]/close failed");
  });

  test("redacts a duty execution token embedded in the event's top-level message", () => {
    const event = { message: "Failed: /driver-api/duty/live-token-abc/start" } as unknown as ErrorEvent;

    const result = scrubEvent(event);

    expect(result.message).toBe("Failed: /driver-api/duty/[redacted]/start");
  });

  test("passes an event with no request context through unchanged", () => {
    const event = { message: "boom" } as unknown as ErrorEvent;

    expect(scrubEvent(event)).toBe(event);
  });
});
