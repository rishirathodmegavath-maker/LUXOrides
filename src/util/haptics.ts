import * as Haptics from "expo-haptics";

// Subtle, meaningful haptics only, at real milestones -- never wired to
// every button (that would just be noise, and risks becoming a driving
// distraction rather than confirmation). Both are best-effort: a haptics
// failure (unsupported device, simulator) must never surface to the driver
// or block whatever real action just happened.
export function successHaptic(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warningHaptic(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
