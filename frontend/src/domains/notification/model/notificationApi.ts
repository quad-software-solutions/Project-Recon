/**
 * Composite notifications from real backend sources (CMS news, event regs).
 * Enrollments are staff-only — do not call that endpoint for students (403 spam).
 * Read/dismiss state is client-side only — no notifications table in backend.
 */
import type { AppNotification } from '@/shared/types';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import { getMyRegistrations } from '@/domains/competition/api/eventsApi';
import {
  STORAGE_KEYS,
  loadIdSet,
  saveIdSet,
  pruneIdSet,
} from '@/shared/utils/storage';

async function buildFeed(): Promise<AppNotification[]> {
  const [newsRes, regs] = await Promise.all([
    cmsPublicApi.getNews({ limit: '20' }).catch(() => ({ results: [] as { id: string; title: string; summary?: string; content?: string; type?: string; published_at?: string | null; created_at: string }[] })),
    getMyRegistrations().catch(() => []),
  ]);

  const items: AppNotification[] = [];
  const news = newsRes?.results || [];

  for (const n of news) {
    items.push({
      id: `news:${n.id}`,
      title: n.title,
      message: n.summary || n.content?.slice(0, 160) || 'New institutional update',
      type: n.type === 'ANNOUNCEMENT' ? 'info' : 'success',
      timestamp: n.published_at || n.created_at,
      read: false,
      actionUrl: undefined,
      icon: '📢',
    });
  }

  for (const r of regs) {
    if (r.registration_status === 'CANCELLED') continue;
    items.push({
      id: `event-reg:${r.id}`,
      title: 'Event registration',
      message: `${r.event_title || 'Event'} — status: ${r.registration_status || 'registered'}`,
      type: 'info',
      timestamp: r.created_at || new Date().toISOString(),
      read: false,
      icon: '🏆',
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items;
}

function pruneStaleIds(feed: AppNotification[]): void {
  const validIds = new Set(feed.map(n => n.id));
  pruneIdSet(STORAGE_KEYS.NOTIFICATION_READ_IDS, validIds);
  pruneIdSet(STORAGE_KEYS.NOTIFICATION_DISMISSED_IDS, validIds);
}

export async function getNotifications(): Promise<AppNotification[]> {
  const feed = await buildFeed();
  pruneStaleIds(feed);
  const read = loadIdSet(STORAGE_KEYS.NOTIFICATION_READ_IDS);
  const dismissed = loadIdSet(STORAGE_KEYS.NOTIFICATION_DISMISSED_IDS);
  return feed
    .filter(n => !dismissed.has(n.id))
    .map(n => ({ ...n, read: read.has(n.id) }));
}

export async function markAsRead(id: string): Promise<void> {
  const read = loadIdSet(STORAGE_KEYS.NOTIFICATION_READ_IDS);
  read.add(id);
  saveIdSet(STORAGE_KEYS.NOTIFICATION_READ_IDS, read);
}

export async function markAllAsRead(): Promise<void> {
  const feed = await buildFeed();
  const read = loadIdSet(STORAGE_KEYS.NOTIFICATION_READ_IDS);
  feed.forEach(n => read.add(n.id));
  saveIdSet(STORAGE_KEYS.NOTIFICATION_READ_IDS, read);
}

export async function getUnreadCount(): Promise<number> {
  const notes = await getNotifications();
  return notes.filter(n => !n.read).length;
}

export async function dismissNotification(id: string): Promise<void> {
  const dismissed = loadIdSet(STORAGE_KEYS.NOTIFICATION_DISMISSED_IDS);
  dismissed.add(id);
  saveIdSet(STORAGE_KEYS.NOTIFICATION_DISMISSED_IDS, dismissed);
}
