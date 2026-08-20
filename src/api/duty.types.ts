// Mirrors the Fleetovo backend's actual DTOs 1:1 (see
// fleetovo-core-service-main/src/main/java/com/core/dtos/driverduty and
// com/core/gateway/razerpay/QrPaymentStatusResponse). getActiveDuties/
// getDutyHistory live-verified against the real backend; start/end are
// sourced directly from the DTO records (no active duty was available to
// exercise them live in this pass).

export interface Money {
  amount: number;
  currency: string;
}

export type DutyStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "ALLOTTED" | "RUNNING" | "COMPLETED" | "CANCELLED";

export interface DutySummaryForDriverDTO {
  dutyId: string;
  bookingId: string;
  status: DutyStatus;
  clientName: string;
  vehicleName: string;
  vehicleNumber: string;
  reportingLocation: string;
  dropLocation: string | null;
  reportingTime: string;
  dropTime: string | null;
  startingKM: number | null;
  closingKM: number | null;
  startAt: string | null;
  endAt: string | null;
  dutyTotal: Money;
}

export interface Page<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

export interface DriverAppDutyTokenResponse {
  token: string;
  expiresAt: string;
}

export interface DriverDutySummaryResponse {
  bookingId: string;
  dutyId: string;
  currentRequiredAction: "START_SUBMISSION" | "END_SUBMISSION" | "COMPLETED";
  clientName: string;
  driverName: string;
  vehicleName: string;
  vehicleNumber: string;
  reportingLocation: string;
  dropLocation: string | null;
  reportingTime: string;
  dropTime: string | null;
  startKm: number | null;
  endKm: number | null;
  startAt: string | null;
  endAt: string | null;
  alreadyStarted: boolean;
  alreadyCompleted: boolean;
}

export interface AddressSnapshot {
  formattedAddress: string;
  googlePlaceId?: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DriverDutyStartRequest {
  odometerKm: number;
  location: AddressSnapshot;
  accuracyMeters: number | null;
  locationCapturedAt: string;
  notes?: string | null;
}

export interface DriverDutyStartResponse {
  success: boolean;
  status: string;
  startKm: number | null;
  startAt: string | null;
  message: string | null;
}

export type DriverDutyExpenseType = "TOLL" | "PARKING" | "OTHER";

export interface DriverDutyExpenseInput {
  type: DriverDutyExpenseType;
  amount: number;
  description?: string | null;
}

export interface DriverDutyEndRequest {
  odometerKm: number;
  location: AddressSnapshot;
  accuracyMeters: number | null;
  locationCapturedAt: string;
  notes?: string | null;
  extraCharges?: DriverDutyExpenseInput[];
}

export interface ReturnRouteEstimate {
  distanceKm: number;
  durationSeconds: number;
  provider: string;
  routeAvailable: boolean;
}

export interface DutyCompletionSummary {
  bookingId: string;
  dutyId: string;
  startKm: number | null;
  endKm: number | null;
  totalKm: number | null;
  startAt: string | null;
  endAt: string | null;
  extraChargesTotal: number;
  bookingTotal: number;
  amountToCollect: number;
  actualDrivenKm: number | null;
  projectedTotalKm: number | null;
  returnRoute: ReturnRouteEstimate | null;
}

export interface PaymentInstruction {
  collectionRequired: boolean;
  amount: number;
  qrCodeUrl: string | null;
  paymentLink: string | null;
  message: string | null;
}

export interface DriverDutyEndResponse {
  success: boolean;
  status: string;
  summary: DutyCompletionSummary;
  paymentInstruction: PaymentInstruction;
  message: string | null;
}

export interface QrPaymentStatusResponse {
  status: "NOT_CREATED" | "PENDING" | "PAID" | "EXPIRED" | "FAILED";
  paid: boolean;
  amount: number | null;
  paymentId: string | null;
  qrImageUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  message: string | null;
}
