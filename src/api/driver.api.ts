import { privateApi } from "./client";
import type { AddressSnapshotDTO, DisplayAddressDTO, DriverDTO, DriverGarageOption, DriverRatingSummary, NameDTO } from "./driver.types";

// Mirrors com.core.dtos.driver.DriverProfileUpdateRequest -- deliberately
// narrower than DriverDTO: name/gender/alternatePhone/email/address/
// garageLocation/experienceYears only. Phone, licenseNumber, adharNumber,
// clientId and ownership are not driver-editable (see
// DriverAppService#updateOwnProfile for why).
export interface DriverProfileUpdateRequest {
  name?: NameDTO | null;
  gender?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  address?: DisplayAddressDTO | null;
  garageLocation?: AddressSnapshotDTO | null;
  experienceYears?: number | null;
}

// Authenticated driver self-service profile (DriverAppController's
// /driver/app/profile, distinct from the read-only /auth/driver/me used at
// login/session-restore).
export const driverApi = {
  getProfile(): Promise<DriverDTO> {
    return privateApi.get<DriverDTO>("/driver/app/profile");
  },

  updateProfile(request: DriverProfileUpdateRequest): Promise<DriverDTO> {
    return privateApi.put<DriverDTO>("/driver/app/profile", request);
  },

  // Real combined rating (client's per-trip ratings + ops's own assessment,
  // see DriverRatingService on the backend) -- backs the Activity screen,
  // which shows this instead of raw earnings.
  getRating(): Promise<DriverRatingSummary> {
    return privateApi.get<DriverRatingSummary>("/driver/app/rating");
  },

  // Real, org-configured garage list (see DriverAppController#getGarages) --
  // backs the onboarding/profile garage picker. Never fabricated options.
  getGarages(): Promise<DriverGarageOption[]> {
    return privateApi.get<DriverGarageOption[]>("/driver/app/garages");
  },
};
