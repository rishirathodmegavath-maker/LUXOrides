import { MockOnboardingService } from "./mock/mockOnboarding";
import { MockPaymentService } from "./mock/mockPayment";
import { MockSupportService } from "./mock/mockSupport";
import { FleetovoAuthService } from "./real/FleetovoAuthService";
import { FleetovoDriverService } from "./real/FleetovoDriverService";
import { FleetovoDutyService } from "./real/FleetovoDutyService";
import {
  AuthService,
  DriverServiceApi,
  DutyService,
  OnboardingService,
  PaymentService,
  SupportService,
} from "./types";

// Day 1: auth + driver session are wired to the real Fleetovo backend.
// Everything else (onboarding/KYC, duty, payment, support) stays on mocks
// until their own integration day — swapping any of them later means
// implementing the same interface (see ./types) and changing only the
// instantiation below, no screen/component code needs to change. Exports
// are explicitly typed as the interface (not the concrete class) so call
// sites only ever depend on the contract.
export const authService: AuthService = new FleetovoAuthService();
export const driverService: DriverServiceApi = new FleetovoDriverService();
export const onboardingService: OnboardingService = new MockOnboardingService();
// Duty list/detail (getTodayDuty/getTrips/getTripById) call the real
// backend; readiness/accept-decline/pickup-OTP/start/end still delegate to
// the mock internally — see FleetovoDutyService's own comment.
export const dutyService: DutyService = new FleetovoDutyService();
export const paymentService: PaymentService = new MockPaymentService();
export const supportService: SupportService = new MockSupportService();

export * from "./types";
