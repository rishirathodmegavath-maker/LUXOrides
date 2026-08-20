import { AuthService, OtpResult, Session } from "../types";
import { delay } from "./utils";

const FIXED_OTP = "123456";

export class MockAuthService implements AuthService {
  private knownPhones = new Set<string>(["9290930909"]);

  async sendOtp(phone: string): Promise<OtpResult> {
    return delay({ phone, expiresInSeconds: 60 }, 900);
  }

  async resendOtp(phone: string): Promise<OtpResult> {
    return delay({ phone, expiresInSeconds: 60 }, 600);
  }

  async verifyOtp(phone: string, code: string): Promise<Session> {
    await delay(null, 900);
    if (code !== FIXED_OTP) {
      throw new Error("Incorrect code. Please try again.");
    }
    const isNewUser = !this.knownPhones.has(phone);
    this.knownPhones.add(phone);
    return { driverId: `driver_${phone}`, phone, isNewUser };
  }

  async logout(): Promise<void> {
    await delay(null, 300);
  }
}
