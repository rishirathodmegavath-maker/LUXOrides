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
  address: DisplayAddressDTO | null;
  adharNumber: string | null;
  licenseNumber: string | null;
  pic: string | null;
  ownership: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
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
