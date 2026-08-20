import { authApi } from "../../api/auth.api";
import { authStorage } from "../../storage/authStorage";
import { useAuthStore } from "../../store/authStore";
import { AuthService, OtpResult, Session } from "../types";

// UI collects a bare 10-digit number with a fixed "+91" prefix (see
// MobileNumberScreen) — the backend requires E.164.
function toE164India(localDigits: string): string {
  return `+91${localDigits}`;
}

// A Driver row only exists once ops has already vetted them (see
// AuthenticationService.generateDriverOtp on the backend — it 404s with
// DRIVER_NOT_FOUND if no Driver record exists for the phone/orgId). So
// unlike the mock's self-signup flow, a successful real login never needs
// the onboarding/KYC gate — clear it immediately.
function markApproved() {
  useAuthStore.getState().setApprovalStatus("approved");
}

export class FleetovoAuthService implements AuthService {
  async sendOtp(phone: string): Promise<OtpResult> {
    const res = await authApi.generateOtp(toE164India(phone));
    return { phone, expiresInSeconds: res.expiresInSeconds };
  }

  async resendOtp(phone: string): Promise<OtpResult> {
    return this.sendOtp(phone);
  }

  async verifyOtp(phone: string, code: string): Promise<Session> {
    const login = await authApi.verifyOtp(toE164India(phone), code);
    await authStorage.setToken(login.token);
    const driver = await authApi.me();
    markApproved();
    return { driverId: driver.id, phone: driver.phone, isNewUser: false };
  }

  async logout(): Promise<void> {
    await authStorage.clearToken();
  }

  async restoreSession(): Promise<Session | null> {
    const token = await authStorage.getToken();
    if (!token) return null;
    try {
      const driver = await authApi.me();
      markApproved();
      return { driverId: driver.id, phone: driver.phone, isNewUser: false };
    } catch {
      await authStorage.clearToken();
      return null;
    }
  }
}
