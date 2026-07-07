import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '@/src/shared/constants/mock-data';
import type { AppNotification } from '@/src/shared/types';

const TYPE_ICONS: Record<string, string> = { info: '🏆', success: '✅', warning: '⚠️', alert: '🚨' };
const TYPE_COLORS: Record<string, string> = { info: 'text-brand-blue bg-brand-blue/10', success: 'text-emerald-500 bg-emerald-50', warning: 'text-amber-500 bg-amber-50', alert: 'text-brand-red bg-brand-red/10' };

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unreadCount}
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
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-11 w-[340px] bg-white rounded-xl border border-brand-border/60 shadow-[0_12px_40px_-8px_rgba(16,20,38,0.15)] z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-brand-border/30 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">Notifications</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{unreadCount} unread</p>
                </div>
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-semibold text-brand-blue hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark read
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notifications.map((n, i) => {
                  const color = TYPE_COLORS[n.type];
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => markRead(n.id)}
                      className={`px-4 py-3 border-b border-brand-border/20 flex items-start gap-2.5 cursor-pointer hover:bg-brand-blue/5 transition-colors ${!n.read ? 'bg-brand-blue/[0.03]' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${color}`}>
                        {n.icon || TYPE_ICONS[n.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <p className={`text-xs leading-snug ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {n.title}
                          </p>
                          {!n.read && <div className="w-1.5 h-1.5 bg-brand-blue rounded-full shrink-0 mt-1" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">{n.message}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{n.timestamp}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="px-4 py-2.5 border-t border-brand-border/30 text-center">
                <button className="text-[10px] font-semibold text-brand-blue hover:underline">
                  View all
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
