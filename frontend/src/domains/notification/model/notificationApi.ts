import { http } from '@/src/shared/api/http';
import { MOCK_NOTIFICATIONS } from '@/src/shared/constants/mock-data';
import type { AppNotification } from '@/src/shared/types';

const BASE = '/notifications';

/**
 * Fetch notifications from backend, fall back to mock data.
 */
export async function getNotifications(): Promise<AppNotification[]> {
  try {
    return await http.get<AppNotification[]>(`${BASE}/`);
  } catch {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_NOTIFICATIONS;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(id: string): Promise<void> {
  try {
    await http.patch(`${BASE}/${id}/`, { read: true });
  } catch {
    await new Promise(r => setTimeout(r, 100));
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllAsRead(): Promise<void> {
  try {
    await http.post(`${BASE}/mark-all-read/`, {});
  } catch {
    await new Promise(r => setTimeout(r, 200));
  }
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const res = await http.get<{ count: number }>(`${BASE}/unread-count/`);
    return res.count;
  } catch {
    const notifs = await getNotifications();
    return notifs.filter(n => !n.read).length;
  }
}

/**
 * Dismiss / remove a notification.
 */
export async function dismissNotification(id: string): Promise<void> {
  try {
    await http.delete(`${BASE}/${id}/`);
  } catch {
    await new Promise(r => setTimeout(r, 100));
  }
}
