import { privateApi } from "./client";
import type { NotificationSummaryResponse } from "./notification.types";

export type DevicePlatform = "ANDROID" | "IOS";

// Driver-authenticated notification feed + device-token registration.
// Mirrors DriverNotificationController -- the backend derives the recipient
// (org + driver) from the JWT itself, never from anything sent here.
export const notificationApi = {
  registerDeviceToken(token: string, platform: DevicePlatform): Promise<void> {
    return privateApi.post<void>("/driver/app/notifications/device-token", { token, platform });
  },

  list(): Promise<NotificationSummaryResponse> {
    return privateApi.get<NotificationSummaryResponse>("/driver/app/notifications");
  },

  markRead(id: string): Promise<void> {
    return privateApi.post<void>(`/driver/app/notifications/${id}/read`);
  },
};
