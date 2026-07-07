import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, Loader2, BellOff, ExternalLink, X } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, dismissNotification } from '../model/notificationApi';
import type { AppNotification } from '@/src/shared/types';

const TYPE_ICONS: Record<string, string> = { info: '🏆', success: '✅', warning: '⚠️', alert: '🚨' };
const TYPE_COLORS: Record<string, string> = { info: 'text-brand-blue bg-brand-blue/10', success: 'text-emerald-500 bg-emerald-50', warning: 'text-amber-500 bg-amber-50', alert: 'text-brand-red bg-brand-red/10' };

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const bellRef = useRef<HTMLButtonElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dismissNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 transition-all duration-200"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        {unreadCount > 0 ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bell className="w-[18px] h-[18px]" />
          </motion.div>
        ) : (
          <Bell className="w-[18px] h-[18px]" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute right-0 top-11 w-[360px] bg-white rounded-xl border border-slate-200/80 shadow-[0_12px_50px_-8px_rgba(16,20,38,0.12)] z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {loading ? 'Loading...' : `${unreadCount} unread · ${notifications.length} total`}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 px-2 py-1 rounded-md hover:bg-brand-blue/5 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                    <BellOff className="w-8 h-8 text-slate-300" />
                    <span className="text-xs font-semibold text-slate-500">All caught up!</span>
                    <span className="text-[10px] text-slate-400">No new notifications</span>
                  </div>
                ) : (
                  notifications.map((n, i) => {
                    const color = TYPE_COLORS[n.type];
                    const icon = n.icon || TYPE_ICONS[n.type] || '🔔';
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.015, duration: 0.2 }}
                        onClick={() => handleMarkRead(n.id)}
                        className={`group px-4 py-3 border-b border-slate-100/80 flex items-start gap-3 cursor-pointer transition-all duration-150 ${
                          !n.read
                            ? 'bg-brand-blue/[0.03] hover:bg-brand-blue/[0.06]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-sm ring-1 ring-black/5 ${color}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs leading-snug ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {!n.read && (
                                <span className="w-2 h-2 bg-brand-blue rounded-full shrink-0 shadow-sm shadow-brand-blue/30" />
                              )}
                              <button
                                onClick={(e) => handleDismiss(e, n.id)}
                                className="p-0.5 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all"
                                title="Dismiss"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-mono">{n.timestamp.startsWith('20') ? timeAgo(n.timestamp) : n.timestamp}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100 text-center bg-slate-50/50">
                  <button className="text-[10px] font-semibold text-brand-blue hover:text-brand-blue-dark flex items-center justify-center gap-1 mx-auto transition-colors">
                    View all notifications
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
