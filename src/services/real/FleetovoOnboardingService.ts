import { documentApi } from "../../api/document.api";
import type { DocumentVerificationStatus } from "../../api/document.types";
import { assertOnline } from "../../util/network";
import { MockOnboardingService } from "../mock/mockOnboarding";
import { DocumentStatus, DocumentType, DriverProfile, OnboardingService } from "../types";

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
// Profile basics / garage location / approval submission have no backend
// support at all yet — those still delegate to the mock (composition, same
// pattern as FleetovoDutyService).
export class FleetovoOnboardingService implements OnboardingService {
  private mock = new MockOnboardingService();

  saveProfileBasics(input: { name: string; email?: string; experienceYears?: number }): Promise<void> {
    return this.mock.saveProfileBasics(input);
  }

  saveGarageLocation(input: { garageName: string; garageAddress: string }): Promise<void> {
    return this.mock.saveGarageLocation(input);
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

  submitForApproval(): Promise<void> {
    return this.mock.submitForApproval();
  }

  getApprovalStatus(): Promise<DriverProfile["approvalStatus"]> {
    return this.mock.getApprovalStatus();
  }
}
