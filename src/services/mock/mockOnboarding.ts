import { DocumentStatus, DocumentType, DriverProfile, OnboardingService } from "../types";
import { delay } from "./utils";

export class MockOnboardingService implements OnboardingService {
  private statuses: Record<DocumentType, DocumentStatus> = {
    drivingLicence: "idle",
    aadhaarCard: "idle",
    profilePhoto: "idle",
  };
  private approval: DriverProfile["approvalStatus"] = "pending";

  async saveProfileBasics(_input: { name: string; email?: string; experienceYears?: number }): Promise<void> {
    await delay(null, 500);
  }

  async saveGarageLocation(_input: { garageName: string; garageAddress: string }): Promise<void> {
    await delay(null, 500);
  }

  async uploadDocument(type: DocumentType, _localUri: string): Promise<{ status: DocumentStatus }> {
    this.statuses[type] = "uploading";
    await delay(null, 800);
    this.statuses[type] = "verifying";
    await delay(null, 1200);
    // Aadhaar card intentionally demonstrates the failure path once so the
    // "wrong document" error screen is reachable during a normal walkthrough.
    const shouldFail = type === "aadhaarCard" && Math.random() < 0.35;
    this.statuses[type] = shouldFail ? "failed" : "verified";
    return { status: this.statuses[type] };
  }

  async getDocumentStatus(type: DocumentType): Promise<DocumentStatus> {
    return delay(this.statuses[type], 200);
  }

  async submitForApproval(): Promise<void> {
    this.approval = "pending";
    await delay(null, 800);
    // Occasionally rejects so the "Not Approved" status screen is reachable
    // during a normal walkthrough, mirroring the uploadDocument failure demo.
    this.approval = Math.random() < 0.2 ? "rejected" : "approved";
  }

  async getApprovalStatus(): Promise<DriverProfile["approvalStatus"]> {
    return delay(this.approval, 300);
  }
}
