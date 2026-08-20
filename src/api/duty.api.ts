import { privateApi, tokenApi, type FilePart } from "./client";
import type {
  DriverAppDutyTokenResponse,
  DriverDutyEndRequest,
  DriverDutyEndResponse,
  DriverDutyStartRequest,
  DriverDutyStartResponse,
  DriverDutySummaryResponse,
  DutySummaryForDriverDTO,
  Page,
  QrPaymentStatusResponse,
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

  // Token-authenticated duty execution API (no Bearer header — the token in
  // the path is the credential).
  getDutySummary(token: string): Promise<DriverDutySummaryResponse> {
    return tokenApi.get<DriverDutySummaryResponse>(`/driver-api/duty/${token}`);
  },

  checkQrPaymentStatus(token: string): Promise<QrPaymentStatusResponse> {
    return tokenApi.get<QrPaymentStatusResponse>(`/driver-api/duty/${token}/payment-status`);
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
};
