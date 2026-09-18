// The only support number the app has to offer -- shared so the dialer
// number can never drift between where it's offered (HelpScreen) and where
// it's offered as a last resort (ErrorBoundary's crash-recovery screen).
export const SUPPORT_PHONE_DISPLAY = "+91 1800-123-4567";
export const SUPPORT_PHONE_TEL = "tel:18001234567";
// Same real number, as an SMS deep link -- used by LiveChatScreen's honest
// "Message Support" action (opens the device's own SMS app pre-addressed
// to this number; no in-app chat backend exists yet).
export const SUPPORT_SMS_URI = "sms:18001234567";
