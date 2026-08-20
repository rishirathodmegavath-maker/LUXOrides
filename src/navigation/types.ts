import { NavigatorScreenParams } from "@react-navigation/native";

export type PermissionKind = "location" | "notifications" | "phoneCalls" | "camera";
export type DocKind = "drivingLicence" | "aadhaarCard";

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  MobileNumber: undefined;
  Otp: { phone: string };
};

export type PermissionsStackParamList = {
  Permission: { kind: PermissionKind };
};

export type OnboardingStackParamList = {
  ProfileBasics: undefined;
  OnboardingHub: undefined;
  DocEntry: { doc: DocKind };
  DocUpload: { doc: DocKind };
  GarageLocation: undefined;
  PrivacyTerms: undefined;
  ProfilePhoto: undefined;
  AlmostReady: undefined;
  NotApproved: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Trips: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type DutyStackParamList = {
  AcceptDuty: undefined;
  DeclineDuty: undefined;
  UniformSelfie: undefined;
  VehicleExterior: undefined;
  VehicleInterior: undefined;
  DutyReadinessSubmit: undefined;
  DutyStartMap: undefined;
  PickupMap: undefined;
  PickupOtp: undefined;
  WaitingForClient: undefined;
  DropOffMap: undefined;
  DropOff: undefined;
  ArrivedAtDropOff: undefined;
  TripSummary: undefined;
  PaymentBilling: undefined;
  PaymentQr: undefined;
  CashPaymentReceived: undefined;
  DutyCompletionSlip: undefined;
  BackToGarage: undefined;
  GarageMap: undefined;
  DutyClosed: undefined;
};

export type HelpStackParamList = {
  Help: undefined;
  Faqs: undefined;
  LiveChat: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Permissions: NavigatorScreenParams<PermissionsStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Duty: NavigatorScreenParams<DutyStackParamList>;
  HelpStack: NavigatorScreenParams<HelpStackParamList>;
  TripDetails: { dutyId: string };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- standard React Navigation typing pattern
    interface RootParamList extends RootStackParamList {}
  }
}
