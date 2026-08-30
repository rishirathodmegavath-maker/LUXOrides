// Mirrors com.core.dtos.driverduty.DriverDocumentResponse. status is null
// when the driver has never uploaded this document type yet.
export type DocumentVerificationStatus = "PENDING_REVIEW" | "VERIFIED" | "REJECTED" | null;

export interface DriverDocumentResponse {
  documentType: string;
  status: DocumentVerificationStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  expiryDate: string | null;
}
