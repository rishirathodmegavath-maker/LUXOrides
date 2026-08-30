import { privateApi, tokenApi, type FilePart } from "./client";
import type {
  CloseDutyConfirmationResponse,
  DriverAppDutyTokenResponse,
  DriverDutyAcceptanceResponse,
  DriverDutyDeclineRequest,
  DriverDutyDeclineResponse,
  DriverDutyEndRequest,
  DriverDutyEndResponse,
  DriverDutyIncidentRequest,
  DriverDutyIncidentResponse,
  DriverDutyLocationPingRequest,
  DriverDutyReturnGarageRequest,
  DriverDutySosRequest,
  DriverDutySosResponse,
  DriverDutyStartRequest,
  DriverDutyStartResponse,
  DriverDutySummaryResponse,
  DutyRouteLegResponse,
  DutySummaryForDriverDTO,
  GarageReturnConfirmationResponse,
  Page,
  PickupOtpGenerateResponse,
  PickupOtpVerifyRequest,
  PickupOtpVerifyResponse,
  QrPaymentStatusResponse,
  VehicleInspectionRequest,
  VehicleInspectionResponse,
} from "./duty.types";

export const dutyApi = {
  // Authenticated driver dashboard API (Bearer JWT).
  getActiveDuties(): Promise<Page<DutySummaryForDriverDTO>> {
    return privateApi.get<Page<DutySummaryForDriverDTO>>("/driver/app/duties/active");
  },

  getDutyHistory(): Promise<Page<DutySummaryForDriverDTO>> {
    return privateApi.get<Page<DutySummaryForDriverDTO>>("/driver/app/duties/history");
  },

  getDuty(dutyId: string): Promise<DutySummaryForDriverDTO> {
    return privateApi.get<DutySummaryForDriverDTO>(`/driver/app/duties/${dutyId}`);
  },

  issueExecutionToken(dutyId: string): Promise<DriverAppDutyTokenResponse> {
    return privateApi.post<DriverAppDutyTokenResponse>(`/driver/app/duties/${dutyId}/token`);
  },

  acceptDuty(dutyId: string): Promise<DriverDutyAcceptanceResponse> {
    return privateApi.post<DriverDutyAcceptanceResponse>(`/driver/app/duties/${dutyId}/accept`);
  },

  declineDuty(dutyId: string, payload: DriverDutyDeclineRequest): Promise<DriverDutyDeclineResponse> {
    return privateApi.post<DriverDutyDeclineResponse>(`/driver/app/duties/${dutyId}/decline`, payload);
  },

  submitInspection(
    dutyId: string,
    payload: VehicleInspectionRequest,
    photos: Record<string, FilePart>
  ): Promise<VehicleInspectionResponse> {
    return privateApi.postMultipart<VehicleInspectionResponse>(
      `/driver/app/duties/${dutyId}/inspection`,
      payload,
      photos
    );
  },

  // Token-authenticated duty execution API (no Bearer header — the token in
  // the path is the credential).
  getDutySummary(token: string): Promise<DriverDutySummaryResponse> {
    return tokenApi.get<DriverDutySummaryResponse>(`/driver-api/duty/${token}`);
  },

  checkQrPaymentStatus(token: string): Promise<QrPaymentStatusResponse> {
    return tokenApi.get<QrPaymentStatusResponse>(`/driver-api/duty/${token}/payment-status`);
  },

  getRouteForLeg(token: string, leg: "PICKUP" | "DROP" | "GARAGE"): Promise<DutyRouteLegResponse> {
    return tokenApi.get<DutyRouteLegResponse>(`/driver-api/duty/${token}/route/${leg}`);
  },

  submitStart(token: string, payload: DriverDutyStartRequest, odometerPhoto: FilePart): Promise<DriverDutyStartResponse> {
    return tokenApi.postMultipart<DriverDutyStartResponse>(`/driver-api/duty/${token}/start`, payload, {
      odometerPhoto,
    });
  },

  submitEnd(
    token: string,
    payload: DriverDutyEndRequest,
    odometerPhoto: FilePart,
    receiptPhotos?: FilePart[]
  ): Promise<DriverDutyEndResponse> {
    return tokenApi.postMultipart<DriverDutyEndResponse>(`/driver-api/duty/${token}/end`, payload, {
      odometerPhoto,
      ...(receiptPhotos && receiptPhotos.length > 0 ? { receiptPhotos } : {}),
    });
  },

  reportLocation(token: string, payload: DriverDutyLocationPingRequest): Promise<void> {
    return tokenApi.post<void>(`/driver-api/duty/${token}/location`, payload);
  },

  generatePickupOtp(token: string): Promise<PickupOtpGenerateResponse> {
    return tokenApi.post<PickupOtpGenerateResponse>(`/driver-api/duty/${token}/pickup-otp/generate`);
  },

  verifyPickupOtp(token: string, payload: PickupOtpVerifyRequest): Promise<PickupOtpVerifyResponse> {
    return tokenApi.post<PickupOtpVerifyResponse>(`/driver-api/duty/${token}/pickup-otp/verify`, payload);
  },

  confirmGarageReturn(token: string, payload: DriverDutyReturnGarageRequest | null): Promise<GarageReturnConfirmationResponse> {
    return tokenApi.post<GarageReturnConfirmationResponse>(`/driver-api/duty/${token}/return-garage`, payload ?? undefined);
  },

  closeDuty(token: string): Promise<CloseDutyConfirmationResponse> {
    return tokenApi.post<CloseDutyConfirmationResponse>(`/driver-api/duty/${token}/close`);
  },

  submitSos(token: string, payload: DriverDutySosRequest): Promise<DriverDutySosResponse> {
    return tokenApi.post<DriverDutySosResponse>(`/driver-api/duty/${token}/sos`, payload);
  },

  submitIncident(
    token: string,
    payload: DriverDutyIncidentRequest,
    photos: FilePart[]
  ): Promise<DriverDutyIncidentResponse> {
    return tokenApi.postMultipart<DriverDutyIncidentResponse>(`/driver-api/duty/${token}/incident`, payload, {
      ...(photos.length > 0 ? { photos } : {}),
    });
  },
};
