import { apiClient as api } from './api.client';

export interface Notification {
  id: number;
  user_id: number;
  group_id: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export const notificationService = {
  async getNotifications(skip = 0, limit = 50): Promise<NotificationResponse> {
    const data = await api.get<NotificationResponse>(`/api/v1/notifications?skip=${skip}&limit=${limit}`);
    return data;
  },

  async getUnreadCount(): Promise<{ unread_count: number }> {
    const data = await api.get<{ unread_count: number }>('/api/v1/notifications/unread-count');
    return data;
  },

  async markAsRead(notificationId: number): Promise<void> {
    await api.patch(`/api/v1/notifications/${notificationId}/read`, {});
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/api/v1/notifications/read-all', {});
  },
  
  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/api/v1/notifications/${notificationId}`);
  }
};
