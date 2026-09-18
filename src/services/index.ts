import { MockSupportService } from "./mock/mockSupport";
import { FleetovoAuthService } from "./real/FleetovoAuthService";
import { FleetovoDriverService } from "./real/FleetovoDriverService";
import { FleetovoDutyService } from "./real/FleetovoDutyService";
import { FleetovoOnboardingService } from "./real/FleetovoOnboardingService";
import {
  AuthService,
  DriverServiceApi,
  DutyService,
  OnboardingService,
  SupportService,
} from "./types";

// Auth, driver session, onboarding, and duty list/detail + execution are all
// wired to the real Fleetovo backend. Support is the one remaining
// exception: FAQs are real static copy served from the mock, and chat has
// no real backend yet, so it's an honest static hand-off rather than a
// simulated conversation (see LiveChatScreen's own comment) — support gets
// its own real integration day later (the dead MockPaymentService/
// MockAuthService/MockDriverService were removed entirely already — nothing
// in the real wiring routes through them). Swapping any of these later means
// implementing the same interface (see ./types) and changing only the
// instantiation below, no screen/component code needs to change. Exports
// are explicitly typed as the interface (not the concrete class) so call
// sites only ever depend on the contract.
export const authService: AuthService = new FleetovoAuthService();
export const driverService: DriverServiceApi = new FleetovoDriverService();
// Document upload/status, profile basics, garage location, and approval
// derivation all call the real backend — nothing in onboarding delegates to
// the mock anymore (see FleetovoOnboardingService's own comment).
export const onboardingService: OnboardingService = new FleetovoOnboardingService();
// Every duty-lifecycle call (list/detail, accept/decline, readiness,
// pickup OTP, both arrival checkpoints, start/end, cash confirmation,
// return-to-garage, close) is real and backend-authoritative — nothing in
// duty execution delegates to the mock anymore (see FleetovoDutyService's
// own comment).
export const dutyService: DutyService = new FleetovoDutyService();
// FAQs are real static app copy, genuinely served from here. Chat
// (getChatMessages/sendChatMessage) has no real backend to call yet --
// LiveChatScreen no longer routes through it (see its own comment); the
// methods stay on the interface/mock for future integration and any
// mock-mode use, they're just not reachable from the real app today.
export const supportService: SupportService = new MockSupportService();

export * from "./types";
