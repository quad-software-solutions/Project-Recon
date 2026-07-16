import type { AppNotification } from '@/shared/types';

const STORAGE_KEY = 'ethio_robotics_notifications';

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: AppNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let cached: AppNotification[] | null = null;

function getCached(): AppNotification[] {
  if (!cached) cached = load();
  return cached;
}

function persist(): void {
  if (cached !== null) save(cached);
}

export async function getNotifications(): Promise<AppNotification[]> {
  return getCached();
}

export async function markAsRead(id: string): Promise<void> {
  const items = getCached();
  const idx = items.findIndex(n => n.id === id);
  if (idx !== -1) {
    items[idx].read = true;
    persist();
  }
}

export async function markAllAsRead(): Promise<void> {
  getCached().forEach(n => { n.read = true; });
  persist();
}

export async function addNotification(notification: AppNotification): Promise<void> {
  getCached().unshift(notification);
  persist();
}

export async function clearNotifications(): Promise<void> {
  cached = [];
  persist();
}
