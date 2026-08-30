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
  clientPhone: string | null;
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
  driverAcceptedAt: string | null;
  driverDeclinedAt: string | null;
  pickupOtpVerifiedAt: string | null;
  garageReturnConfirmedAt: string | null;
  dutyClosedAt: string | null;
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
  clientPhone: string | null;
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

export interface GeoPoint {
  lat: number;
  lng: number;
}

// Mirrors com.core.dtos.driverduty.ReturnRouteEstimate exactly (verified
// against a live /end response, not guessed). geometry is only populated
// when a real road route came back (OpenRouteService) -- when routeAvailable
// is false there is no route to draw, and the client must not fabricate one.
export interface ReturnRouteEstimate {
  distanceKm: number;
  durationSeconds: number;
  provider: string;
  routeAvailable: boolean;
  dropLocation: GeoPoint | null;
  garageLocation: GeoPoint | null;
  geometry: GeoPoint[] | null;
}

// Mirrors com.core.dtos.driverduty.PackageFareBreakdown exactly. Pure read-out of the
// package/rate-card figures BookingUtil already computed onto the duty (base fare, included
// km/time, extra km/time chargeable + their rates) -- never a second, client-side fare calc.
export interface PackageFareBreakdown {
  dutyType: string | null;
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
  fareBreakdown: PackageFareBreakdown | null;
  gstAmount: number | null;
  gstRatePercent: number | null;
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

// Mirrors com.core.dtos.driverduty.DriverDutyLocationPingRequest /
// DriverDutyLocationResponse. capturedAt is the device clock at the moment
// the GPS fix was read, distinct from receivedAt on the backend.
export interface DriverDutyLocationPingRequest {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  headingDegrees: number | null;
  speedMps: number | null;
  capturedAt: string;
}

export interface DriverDutyLocationResponse {
  dutyId: string;
  latitude: number | null;
  longitude: number | null;
  headingDegrees: number | null;
  capturedAt: string | null;
}

// Mirrors com.core.dtos.driverduty.DriverDutySosRequest / DriverDutySosResponse.
export interface DriverDutySosRequest {
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  notes?: string | null;
}

export interface DriverDutySosResponse {
  id: string;
  received: boolean;
}

export type DriverDutyIncidentCategory =
  | "ACCIDENT"
  | "VEHICLE_BREAKDOWN"
  | "TRAFFIC_VIOLATION"
  | "CUSTOMER_DISPUTE"
  | "OTHER";

// Mirrors com.core.dtos.driverduty.DriverDutyIncidentRequest / DriverDutyIncidentResponse.
export interface DriverDutyIncidentRequest {
  category: DriverDutyIncidentCategory;
  description: string;
  location: AddressSnapshot;
  submittedAt: string;
}

export interface DriverDutyIncidentResponse {
  id: string;
  received: boolean;
}

export type VehicleConditionRating = "GOOD" | "MINOR_DAMAGE" | "MAJOR_DAMAGE";

export type CleanlinessRating = "CLEAN" | "NEEDS_CLEANING";
export type FuelLevel = "EMPTY" | "QUARTER" | "HALF" | "THREE_QUARTERS" | "FULL";

// Mirrors com.core.dtos.driverduty.VehicleInspectionRequest / VehicleInspectionResponse.
export interface VehicleInspectionRequest {
  exteriorCondition: VehicleConditionRating;
  interiorCondition: VehicleConditionRating;
  damageNotes: string | null;
  cleanliness: CleanlinessRating;
  tyreCondition: VehicleConditionRating;
  lightsCondition: VehicleConditionRating;
  fuelLevel: FuelLevel | null;
  driverConfirmed: boolean;
}

export interface VehicleInspectionResponse {
  id: string;
  received: boolean;
}

// Mirrors com.core.dtos.driverduty.DriverDutyAcceptanceResponse / DriverDutyDeclineRequest / DriverDutyDeclineResponse.
export interface DriverDutyAcceptanceResponse {
  dutyId: string;
  accepted: boolean;
  acceptedAt: string | null;
}

export interface DriverDutyDeclineRequest {
  reason: string;
}

export interface DriverDutyDeclineResponse {
  dutyId: string;
  declined: boolean;
  declinedAt: string | null;
  reason: string | null;
}

// Mirrors com.core.dtos.driverduty.PickupOtpGenerateResponse / PickupOtpVerifyRequest / PickupOtpVerifyResponse.
export interface PickupOtpGenerateResponse {
  sent: boolean;
  expiresInSeconds: number;
  alreadyVerified: boolean;
}

export interface PickupOtpVerifyRequest {
  otp: string;
}

export interface PickupOtpVerifyResponse {
  verified: boolean;
  verifiedAt: string | null;
}

// Mirrors com.core.dtos.driverduty.DriverDutyReturnGarageRequest / GarageReturnConfirmationResponse / CloseDutyConfirmationResponse.
export interface DriverDutyReturnGarageRequest {
  location: AddressSnapshot | null;
  accuracyMeters: number | null;
  locationCapturedAt: string | null;
}

export interface GarageReturnConfirmationResponse {
  confirmed: boolean;
  confirmedAt: string | null;
}

export interface CloseDutyConfirmationResponse {
  closed: boolean;
  closedAt: string | null;
}

// Mirrors com.core.dtos.driverduty.DutyRouteLegResponse -- a real, on-demand
// route for one leg of the garage-to-garage duty model, computed the same
// way as the existing C->A return-leg estimate. geometry is only populated
// when a real road route came back.
export interface DutyRouteLegResponse {
  leg: "PICKUP" | "DROP" | "GARAGE";
  available: boolean;
  distanceKm: number | null;
  durationSeconds: number | null;
  provider: string | null;
  routeAvailable: boolean;
  fromLocation: GeoPoint | null;
  toLocation: GeoPoint | null;
  geometry: GeoPoint[] | null;
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
