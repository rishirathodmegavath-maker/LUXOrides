import { Sentry } from "../config/sentry";

// No analytics vendor is chosen yet (a product/business decision, not one
// this pass can make on its own) -- but events worth capturing are worth
// capturing now rather than left unwired until that decision lands. Sentry
// is already installed, already reviewed for what it's allowed to see (see
// scrubBreadcrumb/scrubEvent), and a no-op when EXPO_PUBLIC_SENTRY_DSN is
// unset, so recording events as breadcrumbs costs nothing new: zero added
// dependencies, and a real, immediate benefit today (a crash report gets
// the real sequence of what the driver had just done). Swapping in a real
// analytics SDK later means changing the body of `track` alone -- every
// call site stays the same.
//
// Properties passed here must already satisfy the same rules Sentry's own
// scrubbing assumes: no JWT, no execution token, no OTP, no payment
// secrets, no exact GPS coordinates, no customer PII beyond an id. IDs are
// fine (dutyId, bookingId); names/phone numbers are not.
export type AnalyticsEvent =
  | "app_open"
  | "login_success"
  | "duty_received"
  | "duty_accepted"
  | "duty_started"
  | "pickup_otp_verified"
  | "inspection_completed"
  | "drop_completed"
  | "bill_generated"
  | "payment_started"
  | "payment_confirmed"
  | "cash_confirmed"
  | "garage_reached"
  | "duty_closed"
  | "error_recovery";

export function track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): void {
  Sentry.addBreadcrumb({
    category: "analytics",
    message: event,
    data: properties,
    level: "info",
  });
}
