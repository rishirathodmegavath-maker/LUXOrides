// Mirrors the Fleetovo backend's actual DTOs 1:1 (see
// fleetovo-core-service-main/src/main/java/com/core/dtos/auth and
// /driver on the backend) — not guessed shapes. Jackson serializes with
// LOWER_CAMEL_CASE, matching these field names exactly.

export interface DriverOtpRequest {
  mobileNumber: string;
  orgId: string;
}

export interface DriverOtpResponse {
  success: boolean;
  message: string;
  expiresInSeconds: number;
}

export interface DriverOtpVerifyRequest {
  mobileNumber: string;
  orgId: string;
  otp: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
}

export interface NameDTO {
  salutation: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface DisplayAddressDTO {
  formattedAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  countryCode: string | null;
}

// Mirrors com.core.dtos.common.AddressSnapshotDTO exactly.
export interface AddressSnapshotDTO {
  formattedAddress: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
}

// Mirrors com.core.dtos.driver.DriverRatingSummaryResponse exactly.
// combinedAverageRating is null only when neither the client aggregate nor
// ops has rated this driver yet -- never a fabricated default.
export interface DriverRatingSummary {
  clientAverageRating: number | null;
  clientRatingCount: number;
  opsRating: number | null;
  combinedAverageRating: number | null;
}

export interface DriverDTO {
  id: string;
  orgId: string;
  clientId: string | null;
  clientName: NameDTO | null;
  name: NameDTO | null;
  fatherName: NameDTO | null;
  gender: string | null;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  address: DisplayAddressDTO | null;
  garageLocation: AddressSnapshotDTO | null;
  experienceYears: number | null;
  adharNumber: string | null;
  licenseNumber: string | null;
  pic: string | null;
  ownership: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

// Mirrors com.core.dtos.driver.DriverGarageOptionDTO exactly -- one real,
// org-configured garage (see CityGarage on the backend, the same source
// Fleetovo's own garage config screen manages), not a fabricated option.
export interface DriverGarageOption {
  id: string;
  city: string | null;
  garageLocation: AddressSnapshotDTO | null;
}

// Shape of com.core.exception.ApiError, returned on every non-2xx response.
export interface ApiErrorBody {
  code: string;
  message: string;
  status: number;
  path: string;
  method: string;
  timestamp: string;
  traceId: string;
  technicalMessage: string | null;
  exceptionType: string | null;
  metadata: Record<string, unknown> | null;
}
