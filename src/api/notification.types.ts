// Mirrors com.core.dtos.client.app.NotificationResponse / NotificationSummaryResponse
// (shared, recipient-agnostic DTOs -- see NotificationService), returned as-is
// for the DRIVER recipient type by DriverNotificationController.
export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  type: string;
  bookingId: string | null;
  dutyId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationSummaryResponse {
  unreadCount: number;
  notifications: NotificationResponse[];
}
