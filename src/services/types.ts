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
  distanceKm: number;
  etaMinutes: number;
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

export interface DutyService {
  getTodayDuty(): Promise<DutySummary | null>;
  getTrips(): Promise<TripListItem[]>;
  getTripById(id: string): Promise<TripListItem | null>;
  acceptDuty(dutyId: string): Promise<void>;
  declineDuty(dutyId: string, reason: string): Promise<void>;
  submitReadiness(checklist: ReadinessChecklist): Promise<void>;
  getReadinessStatus(): Promise<"pending" | "submitted" | "approved">;
  startDuty(): Promise<void>;
  verifyPickupOtp(code: string): Promise<boolean>;
  markArrivedAtDropoff(): Promise<void>;
  getTripSummary(): Promise<{ distanceKm: number; durationLabel: string }>;
  returnToGarage(): Promise<void>;
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
