import { http } from '@/src/shared/api/http';
import { MOCK_NOTIFICATIONS } from '@/src/shared/constants/mock-data';
import type { AppNotification } from '@/src/shared/types';

const BASE = '/notifications';

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const res = await http.get<{ results: AppNotification[] }>(`${BASE}/`);
    return res.results;
  } catch {
    return MOCK_NOTIFICATIONS;
  }
}

export async function markAsRead(id: string): Promise<void> {
  try {
    await http.patch(`${BASE}/${id}/`, { read: true });
  } catch {
    // silent fallback
  }
}

export async function markAllAsRead(): Promise<void> {
  try {
    await http.post(`${BASE}/mark-all-read/`, {});
  } catch {
    // silent fallback
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await http.get<{ count: number }>(`${BASE}/unread-count/`);
    return res.count;
  } catch {
    const notifs = await getNotifications();
    return notifs.filter(n => !n.read).length;
  }
}

export async function dismissNotification(id: string): Promise<void> {
  try {
    await http.delete(`${BASE}/${id}/`);
  } catch {
    // silent fallback
  }
}
