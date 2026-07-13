import { http } from '@/src/shared/api/http';
import type { AppNotification } from '@/src/shared/types';

const BASE = '/notifications';

async function safeCatch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getNotifications(): Promise<AppNotification[]> {
  return safeCatch(async () => {
    const res = await http.get<{ results: AppNotification[] }>(`${BASE}/`);
    return res.results;
  }, []);
}

export async function markAsRead(id: string): Promise<void> {
  await safeCatch(() => http.patch(`${BASE}/${id}/`, { read: true }), undefined);
}

export async function markAllAsRead(): Promise<void> {
  await safeCatch(() => http.post(`${BASE}/mark-all-read/`, {}), undefined);
}

export async function getUnreadCount(): Promise<number> {
  return safeCatch(async () => {
    const res = await http.get<{ count: number }>(`${BASE}/unread-count/`);
    return res.count;
  }, 0);
}

export async function dismissNotification(id: string): Promise<void> {
  await safeCatch(() => http.delete(`${BASE}/${id}/`), undefined);
}
