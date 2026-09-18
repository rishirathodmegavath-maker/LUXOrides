import { documentApi } from "../../api/document.api";
import type { DocumentVerificationStatus } from "../../api/document.types";
import { driverApi } from "../../api/driver.api";
import { assertOnline } from "../../util/network";
import { DocumentStatus, DocumentType, DriverProfile, GarageOption, OnboardingService } from "../types";

// A single "Full Name" field (ProfileBasicsScreen) has to become the
// backend's structured NameDTO (firstName/lastName) -- splits on the first
// space, same convention TripShareService's firstName() helper uses on the
// backend for the reverse direction. Never throws on an unsplittable name:
// the whole string becomes firstName with an empty lastName.
function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex <= 0) {
    return { firstName: trimmed, lastName: "" };
  }
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1).trim() };
}

function garageDisplayAddress(option: { city: string | null; garageLocation: { formattedAddress: string | null } | null }): string {
  return option.garageLocation?.formattedAddress || option.city || "Garage";
}

function toDocumentStatus(status: DocumentVerificationStatus): DocumentStatus {
  switch (status) {
    case "VERIFIED":
      return "verified";
    case "REJECTED":
      return "failed";
    case "PENDING_REVIEW":
      return "verifying";
    default:
      return "idle";
  }
}

// Real backend has genuine document persistence (DriverDocumentController,
// /driver/app/documents/**) — uploadDocument/getDocumentStatus call it live.
// No auto-verification exists server-side (no ops reviewer UI yet), so a
// fresh upload always comes back "verifying" (PENDING_REVIEW), never a
// simulated instant verified/failed outcome the mock used to fabricate.
//
// Profile basics and garage location previously delegated to the mock too --
// both silently discarded whatever the driver entered (in-memory only, lost
// on restart), and the garage screen additionally showed 3 hardcoded fake
// garage names. Both now go through the same real DriverAppController#
// updateProfile endpoint ProfileInfoScreen (post-onboarding profile edit)
// already uses -- no second/duplicate profile-write API. Garage options come
// from the real CityGarage config ops manages (DriverAppController#
// getGarages), never invented. Approval submission still has no backend
// support (see getApprovalStatus below for why that's fine).
export class FleetovoOnboardingService implements OnboardingService {
  async saveProfileBasics(input: { name: string; email?: string; experienceYears?: number }): Promise<void> {
    await assertOnline();
    const { firstName, lastName } = splitName(input.name);
    await driverApi.updateProfile({
      name: { salutation: null, firstName, lastName },
      email: input.email || null,
      experienceYears: input.experienceYears ?? null,
    });
  }

  async getGarageOptions(): Promise<GarageOption[]> {
    const garages = await driverApi.getGarages();
    return garages.map((g) => ({
      id: g.id,
      garageName: g.city || garageDisplayAddress(g),
      garageAddress: garageDisplayAddress(g),
    }));
  }

  async saveGarageLocation(input: { garageName: string; garageAddress: string }): Promise<void> {
    await assertOnline();
    await driverApi.updateProfile({
      garageLocation: { formattedAddress: input.garageAddress, googlePlaceId: null, latitude: null, longitude: null },
    });
  }

  async uploadDocument(type: DocumentType, localUri: string, expiryDate?: string | null): Promise<{ status: DocumentStatus }> {
    await assertOnline();
    const res = await documentApi.upload(type, { uri: localUri, name: `${type}.jpg`, type: "image/jpeg" }, expiryDate);
    return { status: toDocumentStatus(res.status) };
  }

  async getDocumentStatus(type: DocumentType): Promise<DocumentStatus> {
    const res = await documentApi.getStatus(type);
    return toDocumentStatus(res.status);
  }

  // There is no backend endpoint to record an approval submission (nothing
  // for an ops reviewer to act on yet) -- approval is derived for real in
  // getApprovalStatus() below instead, from the two documents' actual
  // status, so there's nothing to persist here.
  async submitForApproval(): Promise<void> {}

  // Previously delegated to the mock, which resolved "approved"/"rejected"
  // on a client-side random coin flip after a fixed delay -- completely
  // disconnected from whether the driver's real documents (uploaded via
  // documentApi above) were ever actually submitted. That let a driver reach
  // the main app with real documents still sitting at "idle", and just as
  // easily could strand one who *had* uploaded both behind a random
  // "rejected". There's still no ops-reviewer UI to ever mark a document
  // VERIFIED, so "approved" here means "both required documents are real
  // and submitted" (PENDING_REVIEW or VERIFIED) -- the honest bar this
  // backend can actually attest to today, not a simulated final verdict.
  async getApprovalStatus(): Promise<DriverProfile["approvalStatus"]> {
    const [licence, aadhaar] = await Promise.all([
      documentApi.getStatus("drivingLicence"),
      documentApi.getStatus("aadhaarCard"),
    ]);

    if (licence.status === "REJECTED" || aadhaar.status === "REJECTED") return "rejected";

    const submitted = (status: DocumentVerificationStatus) => status === "PENDING_REVIEW" || status === "VERIFIED";
    if (submitted(licence.status) && submitted(aadhaar.status)) return "approved";

    return "pending";
  }
}
