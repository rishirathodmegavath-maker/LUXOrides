import { authApi } from "../../api/auth.api";
import type { NameDTO } from "../../api/driver.types";
import { DriverProfile, DriverServiceApi } from "../types";

function displayName(name: NameDTO | null | undefined): string {
  if (!name) return "";
  return [name.salutation, name.firstName, name.lastName]
    .filter((part) => part && part.trim().length > 0)
    .join(" ")
    .trim();
}

export class FleetovoDriverService implements DriverServiceApi {
  async getProfile(): Promise<DriverProfile> {
    const dto = await authApi.me();
    return {
      id: dto.id,
      name: displayName(dto.name) || "Driver",
      phone: dto.phone,
      // Real, driver-editable fields now (see ProfileInfoScreen) -- distinct
      // from dto.address, the driver's personal/residential address.
      garageAddress: dto.garageLocation?.formattedAddress ?? undefined,
      experienceYears: dto.experienceYears ?? undefined,
      // Real backend has no self-serve approval workflow for drivers (see
      // FleetovoAuthService) — a fetched driver is always an approved one.
      approvalStatus: "approved",
    };
  }
}
