import { env } from "../config/env";
import { privateApi, publicApi } from "./client";
import type { DriverDTO, DriverOtpRequest, DriverOtpResponse, DriverOtpVerifyRequest, LoginResponse } from "./driver.types";

export const authApi = {
  generateOtp(mobileNumber: string): Promise<DriverOtpResponse> {
    const body: DriverOtpRequest = { mobileNumber, orgId: env.orgId };
    return publicApi.post<DriverOtpResponse>("/auth/driver/generate-otp", body);
  },

  verifyOtp(mobileNumber: string, otp: string): Promise<LoginResponse> {
    const body: DriverOtpVerifyRequest = { mobileNumber, orgId: env.orgId, otp };
    return publicApi.post<LoginResponse>("/auth/driver/verify-otp", body);
  },

  me(): Promise<DriverDTO> {
    return privateApi.get<DriverDTO>("/auth/driver/me");
  },
};
