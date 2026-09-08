import { privateApi } from "./client";

export type DevicePlatform = "ANDROID" | "IOS";

// Driver-authenticated device-token registration for duty-assignment push.
// The backend derives the recipient (org + driver) from the JWT itself --
// this call never sends a driverId, matching DriverNotificationController.
export const notificationApi = {
  registerDeviceToken(token: string, platform: DevicePlatform): Promise<void> {
    return privateApi.post<void>("/driver/app/notifications/device-token", { token, platform });
  },
};
