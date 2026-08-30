// Domain contracts for every backend-shaped capability the app needs in
// Phase 1. Each has a Mock* implementation in ./mock; swapping to a real
// backend later means writing a new class that implements the same
// interface and wiring it up in ./index.ts — no screen changes required.

export type DocumentType = "drivingLicence" | "aadhaarCard" | "profilePhoto";
export type DocumentStatus = "idle" | "uploading" | "verifying" | "verified" | "failed";

export interface OtpResult {
  phone: string;
  expiresInSeconds: number;
}

export interface Session {
  driverId: string;
  phone: string;
  isNewUser: boolean;
}

export interface AuthService {
  sendOtp(phone: string): Promise<OtpResult>;
  verifyOtp(phone: string, code: string): Promise<Session>;
  resendOtp(phone: string): Promise<OtpResult>;
  logout(): Promise<void>;
  // Called once at app launch to silently resume a previously-verified
  // session (e.g. from a stored token) without requiring OTP again. Returns
  // null if there is nothing to resume.
  restoreSession(): Promise<Session | null>;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  experienceYears?: number;
  garageName?: string;
  garageAddress?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  photoUrl?: string;
}

export interface OnboardingService {
  saveProfileBasics(input: { name: string; email?: string; experienceYears?: number }): Promise<void>;
  saveGarageLocation(input: { garageName: string; garageAddress: string }): Promise<void>;
  // expiryDate (ISO date string) is optional -- only meaningful for
  // documents that actually expire (e.g. a driving licence).
  uploadDocument(type: DocumentType, localUri: string, expiryDate?: string | null): Promise<{ status: DocumentStatus }>;
  getDocumentStatus(type: DocumentType): Promise<DocumentStatus>;
  submitForApproval(): Promise<void>;
  getApprovalStatus(): Promise<DriverProfile["approvalStatus"]>;
}

export interface DriverServiceApi {
  getProfile(): Promise<DriverProfile>;
}

export type DutyStatus = "assigned" | "readiness" | "enRouteToPickup" | "waitingForClient" | "inTrip" | "atDropoff" | "completed";

export interface TripStop {
  label: string;
  address: string;
  // null on the real backend path: DutySummaryForDriverDTO has no live
  // routing figures for pickup/drop legs (only the drop->garage return leg,
  // computed at duty end, carries real distance/route data). The mock path
  // still provides plausible demo numbers here.
  distanceKm: number | null;
  etaMinutes: number | null;
}

export interface DutySummary {
  id: string;
  type: string;
  reportTime: string;
  durationLabel: string;
  pickup: TripStop;
  dropoff: TripStop;
  clientName: string;
  clientPhone: string | null;
}

export type VehicleCondition = "GOOD" | "MINOR_DAMAGE" | "MAJOR_DAMAGE";
export type Cleanliness = "CLEAN" | "NEEDS_CLEANING";
export type FuelLevel = "EMPTY" | "QUARTER" | "HALF" | "THREE_QUARTERS" | "FULL";

export interface ReadinessChecklist {
  uniformSelfieUri?: string;
  // Angle-keyed (e.g. "Front" -> uri), not a positional array -- a plain
  // array here previously meant Object.values(uris) returned insertion
  // order rather than the fixed angle order, silently mislabelling which
  // photo was which whenever a driver tapped angles out of sequence.
  vehicleExteriorUris: Record<string, string>;
  vehicleInteriorUris: Record<string, string>;
  exteriorCondition?: VehicleCondition;
  interiorCondition?: VehicleCondition;
  damageNotes?: string;
  cleanliness?: Cleanliness;
  tyreCondition?: VehicleCondition;
  lightsCondition?: VehicleCondition;
  fuelLevel?: FuelLevel;
  // Explicit attestation, separate from "every field happens to be filled"
  // -- the backend rejects a submission where this isn't true (see
  // VehicleInspectionService.submitInspection).
  driverConfirmed?: boolean;
}

export interface BillBreakdown {
  bookingAmount: number;
  additionalCharges: number;
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  totalBill: number;
  advancePaid: number;
  advancePaidDate: string;
  balancePayable: number;
  distanceKm: number;
  durationLabel: string;
}

export interface TripListItem {
  id: string;
  type: string;
  clientName: string;
  date: string;
  status: "upcoming" | "completed" | "cancelled";
  pickupAddress: string;
  dropoffAddress: string;
  fare?: number;
}

export interface DutyLocationInput {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  formattedAddress: string;
}

export interface DutyStartInput {
  odometerKm: number;
  photoUri: string;
  location: DutyLocationInput;
}

export interface DutyEndInput extends DutyStartInput {
  expenseAmount?: number;
}

export type IncidentCategory = "ACCIDENT" | "VEHICLE_BREAKDOWN" | "TRAFFIC_VIOLATION" | "CUSTOMER_DISPUTE" | "OTHER";

export interface IncidentReportInput {
  category: IncidentCategory;
  description: string;
  location: DutyLocationInput;
  photoUris: string[];
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

// The drop -> garage return leg Fleetovo actually calculated for this duty
// (com.core.dtos.driverduty.ReturnRouteEstimate) -- real road geometry when
// available, null when the backend has none. Never a client-computed route.
export interface ReturnRoute {
  distanceKm: number;
  durationSeconds: number;
  routeAvailable: boolean;
  dropLocation: GeoPoint | null;
  garageLocation: GeoPoint | null;
  geometry: GeoPoint[] | null;
}

// The package/rate-card breakdown behind the final amount
// (com.core.dtos.driverduty.PackageFareBreakdown) -- base fare, included km/time, and
// whatever extra km/time actually got charged, all backend-computed. Never recalculated
// on-device; this is purely what to display.
export interface FareBreakdown {
  dutyTypeLabel: string | null;
  packageUnit: string | null;
  includedDistanceKm: number | null;
  includedTimeUnits: number | null;
  baseFareAmount: number | null;
  extraDistanceKm: number;
  extraDistanceRatePerKm: number | null;
  extraDistanceCharge: number;
  extraTimeHours: number;
  extraTimeRatePerHour: number | null;
  extraTimeCharge: number;
  projectedTotalDurationSeconds: number | null;
}

export type DutyRouteLeg = "PICKUP" | "DROP" | "GARAGE";

// A real, on-demand route for one garage-to-garage leg
// (com.core.dtos.driverduty.DutyRouteLegResponse). available=false means the
// backend has no waypoint to route from/to yet (e.g. no reporting location
// recorded); routeAvailable=false (with available=true) means a real
// distance/duration came back but no road geometry did. Never fabricated
// either way -- render an explicit "unavailable" state rather than guessing.
export interface DutyLegRoute {
  available: boolean;
  distanceKm: number | null;
  durationSeconds: number | null;
  routeAvailable: boolean;
  fromLocation: GeoPoint | null;
  toLocation: GeoPoint | null;
  geometry: GeoPoint[] | null;
}

export interface DutyEndResult {
  distanceKm: number;
  durationLabel: string;
  amountToCollect: number;
  qrCodeUrl: string | null;
  paymentLink: string | null;
  returnRoute: ReturnRoute | null;
  // Additive fields backing the "Final Fare" breakdown screen -- actualDrivenKm/
  // projectedTotalKm/expensesTotal/fareBreakdown are all real, backend-computed figures
  // (com.core.dtos.driverduty.DutyCompletionSummary). Optional so the mock duty-service
  // path (which has no package/rate-card data to draw from) can omit them without lying
  // about numbers it doesn't have.
  actualDrivenKm?: number | null;
  projectedTotalKm?: number | null;
  expensesTotal?: number;
  fareBreakdown?: FareBreakdown | null;
  // Already folded into amountToCollect by the backend (BookingUtil.calculateTotalAmount) --
  // shown only when non-zero so the breakdown rows visibly account for the full final
  // amount on a GST-registered org, without cluttering the (today, default) exempt case.
  gstAmount?: number | null;
  gstRatePercent?: number | null;
}

export interface DutyService {
  getTodayDuty(): Promise<DutySummary | null>;
  getTrips(): Promise<TripListItem[]>;
  getTripById(id: string): Promise<TripListItem | null>;
  acceptDuty(dutyId: string): Promise<void>;
  declineDuty(dutyId: string, reason: string): Promise<void>;
  submitReadiness(checklist: ReadinessChecklist): Promise<void>;
  getReadinessStatus(): Promise<"pending" | "submitted" | "approved">;
  // Odometer photo + GPS are what the real backend actually requires to
  // start/end a duty (see FleetovoDutyService) — the mock ignores the
  // detail and simulates the same outcome.
  startDuty(input: DutyStartInput): Promise<void>;
  // Generates/resends the real, server-verified pickup OTP (SMS'd to the
  // customer on the booking). Throws with a real backend message if the
  // duty isn't running yet or the customer phone is unavailable.
  requestPickupOtp(): Promise<void>;
  // Throws (ApiError with a real backend message: incorrect code, expired,
  // too many attempts) rather than returning false -- there is no
  // client-side success condition for this step, the backend is the only
  // authority.
  verifyPickupOtp(code: string): Promise<void>;
  markArrivedAtDropoff(): Promise<void>;
  endDuty(input: DutyEndInput): Promise<DutyEndResult>;
  checkPaymentStatus(): Promise<{ paid: boolean; status: string; amount: number | null; qrImageUrl: string | null }>;
  // location is best-effort (same convention as SOS/incident) -- a missing
  // GPS fix doesn't block the real backend confirmation, it just leaves the
  // checkpoint flagged NEEDS_REVIEW server-side.
  returnToGarage(location?: DutyLocationInput | null): Promise<void>;
  closeDuty(): Promise<void>;
  // Both require an active duty's execution token (minted by startDuty) --
  // there is no backend endpoint for either outside a duty's token window.
  // SOS deliberately takes a raw coordinate, not a full DutyLocationInput --
  // it's a raw safety ping with no reverse-geocode step, unlike an incident
  // report's authored location.
  triggerSos(location: { latitude: number; longitude: number } | null, notes?: string): Promise<void>;
  submitIncident(input: IncidentReportInput): Promise<void>;
  // Real, on-demand route for the given leg -- requires a started duty
  // (execution token). Never fabricated: an unreachable/unavailable route
  // comes back as available:false rather than a guessed figure.
  getRouteForLeg(leg: DutyRouteLeg): Promise<DutyLegRoute>;
}

export interface PaymentService {
  getBill(dutyId: string): Promise<BillBreakdown>;
  getQrPaymentInfo(): Promise<{ upiId: string; qrPayload: string }>;
  confirmCashPayment(amount: number): Promise<void>;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  from: "driver" | "support";
  text: string;
  timestamp: string;
}

export interface SupportService {
  getFaqs(): Promise<FaqItem[]>;
  getChatMessages(): Promise<ChatMessage[]>;
  sendChatMessage(text: string): Promise<ChatMessage>;
}
