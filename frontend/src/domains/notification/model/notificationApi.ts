import { http } from '@/src/shared/api/http';
import type { AppNotification } from '@/src/shared/types';

const BASE = '/notifications';

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await http.get<{ results: AppNotification[] }>(`${BASE}/`);
  return res.results;
}

export async function markAsRead(id: string): Promise<void> {
  await http.patch(`${BASE}/${id}/`, { read: true });
}

export async function markAllAsRead(): Promise<void> {
  await http.post(`${BASE}/mark-all-read/`, {});
}

export async function getUnreadCount(): Promise<number> {
  const res = await http.get<{ count: number }>(`${BASE}/unread-count/`);
  return res.count;
}

export async function dismissNotification(id: string): Promise<void> {
  await http.delete(`${BASE}/${id}/`);
}
