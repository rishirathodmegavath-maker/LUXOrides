import * as Sentry from "@sentry/react-native";

// Optional by design, unlike env.ts's required API base URL/org id: a
// missing DSN means crash reporting is simply off (e.g. local dev, or before
// a Sentry project exists yet), not a broken build -- mirrors the same
// "no-op when unconfigured" convention already used for Firebase push
// (PushNotificationService) rather than failing fast like a truly required
// value would.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

const SENSITIVE_HEADER_NAMES = new Set(["authorization", "cookie", "set-cookie"]);

// The duty-execution token is a bearer-equivalent credential carried
// directly in the URL PATH (never a header) for every /driver-api/duty/
// {token}/** call — start, end, location pings, pickup OTP, payment status,
// garage return, close, SOS, incident. Without this, every one of those
// breadcrumbs would upload the live token in plain sight for the rest of
// that duty's lifetime.
function redactDutyToken(url: string): string {
  return url.replace(/\/driver-api\/duty\/[^/?]+/, "/driver-api/duty/[redacted]");
}

// Sentry's HTTP client breadcrumb captures method/url/status by default --
// never the body -- but the Authorization header (the driver's JWT) can ride
// along in `data.headers` on some integrations, so it's stripped defensively
// here rather than trusted to already be absent. URL query strings are also
// dropped: pickup OTP verify, receipt uploads, and payment endpoints don't
// currently put secrets in the query string, but a breadcrumb trail is not
// the place to find that out the hard way later.
export function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (breadcrumb.category === "http" || breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
    const data = breadcrumb.data as Record<string, unknown> | undefined;
    if (data?.headers && typeof data.headers === "object") {
      const headers = { ...(data.headers as Record<string, string>) };
      for (const key of Object.keys(headers)) {
        if (SENSITIVE_HEADER_NAMES.has(key.toLowerCase())) {
          headers[key] = "[redacted]";
        }
      }
      data.headers = headers;
    }
    if (typeof data?.url === "string") {
      const withoutQuery = data.url.includes("?") ? data.url.split("?")[0] : data.url;
      data.url = redactDutyToken(withoutQuery);
    }
  }
  return breadcrumb;
}

// Belt-and-suspenders on top of scrubBreadcrumb: strips the same header from
// the event's own request context (populated for some native crash reports)
// and from the exception message/values in the rare case a thrown Error's
// own message happened to interpolate a header or token (e.g. a NetworkError
// or ApiError whose message embeds the failed request's URL).
export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const requestHeaders = event.request?.headers;
  if (requestHeaders) {
    for (const key of Object.keys(requestHeaders)) {
      if (SENSITIVE_HEADER_NAMES.has(key.toLowerCase())) {
        requestHeaders[key] = "[redacted]";
      }
    }
  }
  if (event.request?.url) {
    event.request.url = redactDutyToken(event.request.url);
  }
  for (const value of event.exception?.values ?? []) {
    if (typeof value.value === "string") {
      value.value = redactDutyToken(value.value);
    }
  }
  if (typeof event.message === "string") {
    event.message = redactDutyToken(event.message);
  }
  return event;
}

export function initSentry(): void {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    // Never trace full request bodies/params -- OTP, payment amounts, and
    // customer PII pass through those bodies, and default performance
    // tracing has no reason to see them.
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
  });
}

export { Sentry };
