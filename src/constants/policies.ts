// Mirrors the Customer App's policy content verbatim (app.luxorides.com-main
// components/policies/policy.data.ts) -- same three policies, same wording,
// same version/date, same "Read Full Policy" targets, so a driver and a
// customer are never shown two different accounts of the same policy.
export type PolicyType = "TERMS" | "PRIVACY" | "CANCELLATION";

export interface Policy {
  type: PolicyType;
  version: string;
  title: string;
  summaryPoints: string[];
  fullUrl: string;
  lastUpdated: string;
}

export const POLICIES: Policy[] = [
  {
    type: "CANCELLATION",
    version: "v1.0",
    title: "Cancellation & Refund Policy",
    lastUpdated: "March 2026",
    fullUrl: "https://luxorides.com/cancellation-and-refund-policy.html",
    summaryPoints: [
      "Applies only to confirmed bookings",
      "Free cancellation before booking confirmation",
      "No charge if cancelled 48+ hours before ride",
      "25% charge within 48 hours",
      "50% charge within 36 hours",
      "80% charge within 24 hours",
      "100% charge within 4 hours or no-show",
      "No-show = chauffeur arrives and no response within 1 hour",
      "Special bookings (weddings, multi-day) may have custom terms",
      "Refunds processed to original payment method",
      "Refund timeline: up to 7 working days",
      "Gateway fees, taxes, or damage charges may not be refundable",
    ],
  },

  {
    type: "PRIVACY",
    version: "v1.0",
    title: "Privacy Policy",
    lastUpdated: "March 2026",
    fullUrl: "https://luxorides.com/privacy-policy.html",
    summaryPoints: [
      "We collect only necessary data (name, phone, email, booking details)",
      "Payment data stored as metadata only (no full card details)",
      "Call recordings may be used for safety, quality, and disputes",
      "Customer live location is NOT tracked",
      "Chauffeur live location is tracked during active rides",
      "Data used for bookings, support, payments, fraud prevention, and service improvement",
      "Data access is strictly role-based (internal teams, chauffeurs, vendors)",
      "We do NOT sell personal data",
      "Compliant with India DPDP Act, 2023",
      "Data retained only as long as required for service or legal obligations",
      "Users can request access, correction, or deletion of data",
    ],
  },

  {
    type: "TERMS",
    version: "v1.0",
    title: "Terms & Conditions",
    lastUpdated: "March 2026",
    fullUrl: "https://luxorides.com/terms-and-conditions.html",
    summaryPoints: [
      "Luxorides is a technology platform, not the vehicle owner",
      "Vehicles and chauffeurs may be provided by third-party partners",
      "All bookings are request-based and require manual confirmation",
      "Payment does NOT guarantee booking confirmation",
      "Unconfirmed bookings are refunded as per policy",
      "Additional charges (tolls, parking, route changes) may apply",
      "Users must provide accurate details and follow conduct rules",
      "Damage, misuse, or excessive cleaning may incur charges",
      "Calls may be recorded for safety and dispute resolution",
      "Service availability may be affected by traffic, weather, or external factors",
      "Liability is limited to booking value (base fare)",
      "Luxorides is not responsible for third-party actions",
      "Governed by Indian law (Delhi jurisdiction)",
    ],
  },
];

// Same "critical" heuristic as the Customer App's PolicyCard/PolicyModal, so
// the same bullets read as highlighted everywhere they appear.
export function isCriticalPoint(point: string): boolean {
  return point.includes("100%") || point.includes("liability") || point.includes("charge");
}
