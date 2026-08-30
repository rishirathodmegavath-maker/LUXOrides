import { privateApi, type FilePart } from "./client";
import type { DriverDocumentResponse } from "./document.types";

// Authenticated driver KYC/document API (Bearer JWT) -- DriverDocumentController.
export const documentApi = {
  getStatus(documentType: string): Promise<DriverDocumentResponse> {
    return privateApi.get<DriverDocumentResponse>(`/driver/app/documents/${documentType}`);
  },

  upload(documentType: string, file: FilePart, expiryDate?: string | null): Promise<DriverDocumentResponse> {
    return privateApi.postMultipart<DriverDocumentResponse>(
      `/driver/app/documents/${documentType}`,
      expiryDate ? { expiryDate } : undefined,
      { file }
    );
  },
};
