import { MockAuthService } from "./mock/mockAuth";
import { MockOnboardingService } from "./mock/mockOnboarding";
import { MockDriverService } from "./mock/mockDriver";
import { MockDutyService } from "./mock/mockDuty";
import { MockPaymentService } from "./mock/mockPayment";
import { MockSupportService } from "./mock/mockSupport";
import {
  AuthService,
  DriverServiceApi,
  DutyService,
  OnboardingService,
  PaymentService,
  SupportService,
} from "./types";

// Phase 1 wires the mock implementations. Swapping to real backends later
// means implementing the same interfaces (see ./types) against real APIs
// and changing only the instantiations below — no screen/component code
// needs to change. Exports are explicitly typed as the interface (not the
// concrete Mock* class) so call sites only ever depend on the contract.
export const authService: AuthService = new MockAuthService();
export const onboardingService: OnboardingService = new MockOnboardingService();
export const driverService: DriverServiceApi = new MockDriverService();
export const dutyService: DutyService = new MockDutyService();
export const paymentService: PaymentService = new MockPaymentService();
export const supportService: SupportService = new MockSupportService();

export * from "./types";
