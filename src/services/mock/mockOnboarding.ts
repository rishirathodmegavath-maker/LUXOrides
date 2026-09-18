import { DocumentStatus, DocumentType, DriverProfile, GarageOption, OnboardingService } from "../types";
import { delay } from "./utils";

// Fake garage names only ever surfaced here, in the mock service used when
// the app is deliberately running without a backend (see services/index.ts)
// -- never in FleetovoOnboardingService, which fetches the real, org-
// configured list.
const MOCK_GARAGES: GarageOption[] = [
  { id: "garage_delhi", garageName: "Garage Inc., New Delhi", garageAddress: "Garage Inc., New Delhi" },
  { id: "garage_gurugram", garageName: "Garage Inc., Gurugram", garageAddress: "Garage Inc., Gurugram" },
  { id: "garage_noida", garageName: "Garage Inc., Noida", garageAddress: "Garage Inc., Noida" },
];

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

  async getGarageOptions(): Promise<GarageOption[]> {
    return delay(MOCK_GARAGES, 300);
  }

  async saveGarageLocation(_input: { garageName: string; garageAddress: string }): Promise<void> {
    await delay(null, 500);
  }

  async uploadDocument(type: DocumentType, _localUri: string, _expiryDate?: string | null): Promise<{ status: DocumentStatus }> {
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
