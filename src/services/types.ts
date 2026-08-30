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
  uploadDocument(type: DocumentType, localUri: string): Promise<{ status: DocumentStatus }>;
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
}

export interface ReadinessChecklist {
  uniformSelfieUri?: string;
  vehicleExteriorUris: string[];
  vehicleInteriorUris: string[];
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
  // location is best-effort -- a missing GPS fix doesn't block the real
  // backend confirmation, it just leaves the checkpoint flagged
  // NEEDS_REVIEW server-side.
  returnToGarage(location?: DutyLocationInput | null): Promise<void>;
  closeDuty(): Promise<void>;
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
