import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, Loader2, AlertCircle, Calendar, MapPin, Users, Tag, Globe,
  CheckCircle, Eye, Edit3, Trash2, Send, ToggleLeft, ToggleRight, Clock, Youtube,
  Trophy, GraduationCap, Swords, UserPlus, Image, DollarSign, Lock, Unlock,
  FileText, Settings, ChevronRight, Sparkles, ArrowRight, ExternalLink,
  Copy, MoreHorizontal, Archive, Filter, ChevronUp, ChevronDown,
  CheckSquare, Square, Download
} from 'lucide-react';
import * as eventsApi from '../../competition/api/eventsApi';
import type { BackendEvent } from '../../competition/api/eventsApi';
import { Modal } from '@/shared/ui/Modal';
import type { UserProfile } from '@/shared/types';
import { canManageEvents } from '@/shared/auth/permissions';

const defaultForm = {
  title: '', description: '', location: '', event_type: 'GENERAL' as eventsApi.EventType,
  start_datetime: '', end_datetime: '', registration_deadline: '',
  visibility: 'PUBLIC' as eventsApi.Visibility,
  registration_enabled: false, registration_mode: 'PUBLIC' as eventsApi.RegistrationMode,
  payment_required: false, registration_fee: '', capacity: '', youtube_live_url: '',
  branch: '', banner: null as File | null, bannerPreview: '' as string,
};

function EventThumb({ event }: { event: BackendEvent }) {
  if (event.banner) {
    return (
      <img
        src={event.banner}
        alt={event.title}
        referrerPolicy="no-referrer"
        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-50"
      />
    );
  }

  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
      event.event_type === 'TOURNAMENT' ? 'bg-purple-100 text-purple-600' :
      event.event_type === 'WORKSHOP' ? 'bg-cyan-100 text-cyan-600' :
      'bg-gradient-to-br from-brand-red/10 to-brand-red/5 text-brand-red'
    }`}>
      {event.event_type === 'TOURNAMENT' ? <Trophy className="w-4 h-4" /> :
       event.event_type === 'WORKSHOP' ? <GraduationCap className="w-4 h-4" /> :
       <Calendar className="w-4 h-4" />}
    </div>
  );
}

const EVENT_TYPE_OPTIONS = [
  { value: 'GENERAL' as const, label: 'General', icon: Calendar, desc: 'Standard event listing', color: 'text-slate-600', bg: 'bg-slate-50' },
  { value: 'TOURNAMENT' as const, label: 'Tournament', icon: Trophy, desc: 'Competition with teams & matches', color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'WORKSHOP' as const, label: 'Workshop', icon: GraduationCap, desc: 'Educational session with instructor', color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC' as const, label: 'Public', icon: Globe, desc: 'Visible to everyone on the website' },
  { value: 'PRIVATE' as const, label: 'Private', icon: Lock, desc: 'Only visible to staff and registered users' },
];

const REGISTRATION_MODES = [
  { value: 'PUBLIC' as const, label: 'Public', desc: 'Anyone can register' },
  { value: 'STUDENT' as const, label: 'Student', desc: 'Only registered students' },
  { value: 'SUBPROGRAM_STUDENT' as const, label: 'Sub-Program', desc: 'Students in specific sub-programs' },
];

type SortField = 'title' | 'event_type' | 'start_datetime' | 'status';
type SortDir = 'asc' | 'desc';

interface EventManagerProps {
  currentUser?: UserProfile;
  onNavigate?: (section: string) => void;
}

export default function EventManager({ currentUser, onNavigate }: EventManagerProps) {
  const canManage = currentUser ? canManageEvents(currentUser) : false;
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [branches, setBranches] = useState<any[]>([]);
  const [menuEvent, setMenuEvent] = useState<BackendEvent | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [deleteTarget, setDeleteTarget] = useState<BackendEvent | null>(null);
  const [sortField, setSortField] = useState<SortField>('start_datetime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const closeMenu = useCallback(() => { setMenuEvent(null); }, []);

  const openMenu = useCallback((ev: React.MouseEvent<HTMLButtonElement>, event: BackendEvent) => {
    if (menuEvent?.id === event.id) {
      closeMenu();
      return;
    }
    const rect = ev.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right + 12 });
    setMenuEvent(event);
  }, [menuEvent, closeMenu]);

  const load = () => {
    setLoading(true);
    Promise.all([
      eventsApi.adminGetEvents(),
      import('../../user/shared/api/adminApi').then(m => m.branchesApi.list() as Promise<any[]>).catch(() => []),
    ]).then(([evts, brs]) => {
      setEvents(Array.isArray(evts) ? evts : []);
      setBranches(Array.isArray(brs) ? brs : []);
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setErrors({});
    setError(null);
    setShowForm(true);
  };

  const openEdit = (e: BackendEvent) => {
    setEditingId(e.id);
    setErrors({});
    setError(null);
    setForm({
      title: e.title || '',
      description: e.description || '',
      location: e.location || '',
      event_type: e.event_type || 'GENERAL',
      start_datetime: e.start_datetime?.slice(0, 16) || '',
      end_datetime: e.end_datetime?.slice(0, 16) || '',
      registration_deadline: e.registration_deadline?.slice(0, 16) || '',
      visibility: e.visibility || 'PUBLIC',
      registration_enabled: e.registration_enabled || false,
      registration_mode: e.registration_mode || 'PUBLIC',
      payment_required: e.payment_required || false,
      registration_fee: e.registration_fee || '',
      capacity: e.capacity?.toString() || '',
      youtube_live_url: e.youtube_live_url || '',
      branch: e.branch || '',
      banner: null,
      bannerPreview: e.banner || '',
    });
    setShowForm(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.start_datetime) errs.start_datetime = 'Start date is required';
    if (!form.end_datetime) errs.end_datetime = 'End date is required';
    if (form.start_datetime && form.end_datetime && form.start_datetime >= form.end_datetime) {
      errs.end_datetime = 'End date must be after start date';
    }
    if (!form.location.trim()) errs.location = 'Location is required';
    if (form.youtube_live_url && !form.youtube_live_url.startsWith('http')) {
      errs.youtube_live_url = 'Must be a valid URL starting with http';
    }
    if (form.capacity && (parseInt(form.capacity) < 1)) {
      errs.capacity = 'Capacity must be at least 1';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const hasBanner = form.banner instanceof File;
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        event_type: form.event_type,
        start_datetime: form.start_datetime,
        end_datetime: form.end_datetime,
        registration_deadline: form.registration_deadline || null,
        visibility: form.visibility,
        registration_enabled: form.registration_enabled,
        registration_mode: form.registration_enabled ? form.registration_mode : null,
        payment_required: form.registration_enabled ? form.payment_required : false,
        registration_fee: form.registration_enabled && form.payment_required && form.registration_fee ? form.registration_fee : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        youtube_live_url: form.youtube_live_url.trim() || null,
        branch: form.branch || null,
      };
      if (hasBanner) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(payload)) {
          if (v !== null && v !== undefined) fd.append(k, String(v));
        }
        fd.append('banner', form.banner);
        if (editingId) {
          await eventsApi.adminUpdateEvent(editingId, fd);
        } else {
          await eventsApi.adminCreateEvent(fd);
        }
      } else {
        if (editingId) {
          await eventsApi.adminUpdateEvent(editingId, payload as Partial<BackendEvent>);
        } else {
          await eventsApi.adminCreateEvent(payload as Partial<BackendEvent>);
        }
      }
      setShowForm(false);
      showToast(editingId ? 'Event updated successfully' : 'Event created successfully');
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await eventsApi.adminDeleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Event deleted');
      load();
    } catch (err: any) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const target = events.find(e => e.id === id);
      if (!target) return;
      if (target.status === 'PUBLISHED') {
        await eventsApi.adminUnpublishEvent(id);
        showToast('Event unpublished');
      } else {
        await eventsApi.adminPublishEvent(id);
        showToast('Event published');
      }
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      if (current) {
        await eventsApi.adminDeactivateEvent(id);
        showToast('Event deactivated');
      } else {
        await eventsApi.adminActivateEvent(id);
        showToast('Event activated');
      }
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleDuplicate = async (e: BackendEvent) => {
    try {
      const payload = {
        title: `${e.title} (Copy)`,
        description: e.description,
        location: e.location,
        event_type: e.event_type,
        start_datetime: e.start_datetime,
        end_datetime: e.end_datetime,
        registration_deadline: e.registration_deadline,
        visibility: e.visibility,
        registration_enabled: e.registration_enabled,
        registration_mode: e.registration_mode,
        payment_required: e.payment_required,
        registration_fee: e.registration_fee,
        capacity: e.capacity,
        youtube_live_url: e.youtube_live_url,
        branch: e.branch,
      };
      await eventsApi.adminCreateEvent(payload as Partial<BackendEvent>);
      showToast('Event duplicated');
      load();
    } catch (err: any) { setError(err.message); }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected events?`)) return;
    setBulkActionLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => eventsApi.adminDeleteEvent(id)));
      showToast(`${selectedIds.size} events deleted`);
      setSelectedIds(new Set());
      load();
    } catch (err: any) { setError(err.message); }
    setBulkActionLoading(false);
  };

  const handleBulkPublish = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => eventsApi.adminPublishEvent(id)));
      showToast(`${selectedIds.size} events published`);
      setSelectedIds(new Set());
      load();
    } catch (err: any) { setError(err.message); }
    setBulkActionLoading(false);
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => eventsApi.adminActivateEvent(id)));
      showToast(`${selectedIds.size} events activated`);
      setSelectedIds(new Set());
      load();
    } catch (err: any) { setError(err.message); }
    setBulkActionLoading(false);
  };

  const filtered = useMemo(() => {
    let result = [...events];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') {
      result = result.filter(e => e.event_type === filterType);
    }
    if (filterStatus !== 'all') {
      result = result.filter(e => e.status === filterStatus);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'event_type': cmp = a.event_type.localeCompare(b.event_type); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'start_datetime': cmp = new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [events, searchQuery, filterType, filterStatus, sortField, sortDir]);

  // Pagination
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [filterType, filterStatus, searchQuery]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
      PUBLISHED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      GENERAL: 'bg-slate-100 text-slate-600',
      TOURNAMENT: 'bg-purple-100 text-purple-700',
      WORKSHOP: 'bg-cyan-100 text-cyan-700',
    };
    return map[t] || 'bg-slate-100 text-slate-600';
  };

  const visibilityBadge = (v: string) => {
    const map: Record<string, string> = {
      PUBLIC: 'bg-sky-100 text-sky-700 border-sky-200',
      PRIVATE: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return map[v] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const stats = useMemo(() => ({
    total: events.length,
    published: events.filter(e => e.status === 'PUBLISHED').length,
    tournaments: events.filter(e => e.event_type === 'TOURNAMENT').length,
    upcoming: events.filter(e => new Date(e.start_datetime) > new Date()).length,
  }), [events]);

  const formattedDate = (dt: string) => {
    try { return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dt?.slice(0, 10) || '—'; }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-colors ${
      errors[field] ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-red'
    }`;

  const renderTypeCard = (opt: typeof EVENT_TYPE_OPTIONS[0]) => {
    const Icon = opt.icon;
    const isActive = form.event_type === opt.value;
    return (
      <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, event_type: opt.value }))}
        className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
          isActive ? 'border-brand-red bg-brand-red/5' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl ${opt.bg} flex items-center justify-center shrink-0 ${isActive ? 'ring-2 ring-brand-red/20' : ''}`}>
          <Icon className={`w-5 h-5 ${opt.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isActive ? 'text-brand-red' : 'text-slate-900'}`}>{opt.label}</span>
            {isActive && <CheckCircle className="w-4 h-4 text-brand-red" />}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
        </div>
      </button>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const renderActionsDropdown = () => {
    const e = menuEvent;
    if (!e) return null;
    return createPortal(
      <>
        <div className="fixed inset-0 z-40" onClick={closeMenu} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
          className="z-50 w-60 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/15 py-2 overflow-hidden origin-top-right">
          <div className="px-2 pb-2 mb-1.5 border-b border-slate-100">
            <div className="px-2 pb-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">More</div>
            <button onClick={() => { handleDuplicate(e); closeMenu(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-blue-50 rounded-xl transition-colors">
              <Copy className="w-4 h-4 text-blue-500" /> Duplicate
            </button>
          </div>
          <div className="px-2 pb-2 mb-1.5 border-b border-slate-100">
            <div className="px-2 pb-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Related</div>
            <button onClick={() => { onNavigate?.('event-registrations'); closeMenu(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              <UserPlus className="w-4 h-4 text-slate-400" /> Registrations
            </button>
          </div>
          <div className="px-2">
            <div className="px-2 pb-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Danger</div>
            <button onClick={() => { setDeleteTarget(e); closeMenu(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" /> Delete Event
            </button>
          </div>
        </motion.div>
      </>,
      document.body
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="w-8 h-8 rounded-lg bg-slate-200 mb-2" />
            <div className="h-6 w-12 bg-slate-200 rounded mb-1" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-brand-border p-4 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
            <div className="h-5 w-14 bg-slate-200 rounded-full" />
            <div className="h-5 w-5 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!canManage) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="mt-1 text-amber-700">Event management is only available to Super Admin and Branch Manager roles.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return renderSkeleton();

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Total Events', value: stats.total, icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Published', value: stats.published, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tournaments', value: stats.tournaments, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-sm transition-all"
            >
              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mb-1.5`}><SIcon className={`w-3.5 h-3.5 ${stat.color}`} /></div>
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-lg text-slate-900">Events</h3>
            <p className="text-xs text-slate-500 mt-0.5">{stats.total} events · {stats.published} published · {stats.upcoming} upcoming</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search events..."
                className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" />
            </div>
            <button onClick={openCreate}
              className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-brand-border rounded-lg text-[11px] font-medium text-slate-600 focus:outline-none focus:border-brand-red">
            <option value="all">All Types</option>
            <option value="GENERAL">General</option>
            <option value="TOURNAMENT">Tournament</option>
            <option value="WORKSHOP">Workshop</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-white border border-brand-border rounded-lg text-[11px] font-medium text-slate-600 focus:outline-none focus:border-brand-red">
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {filtered.length > 0 && (
            <span className="text-[11px] text-slate-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 bg-brand-red/5 border border-brand-red/20 rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold text-slate-700">{selectedIds.size} selected</span>
            <div className="w-px h-4 bg-slate-200" />
            <button onClick={handleBulkPublish} disabled={bulkActionLoading}
              className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              Publish All
            </button>
            <button onClick={handleBulkActivate} disabled={bulkActionLoading}
              className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              Activate All
            </button>
            <button onClick={handleBulkDelete} disabled={bulkActionLoading}
              className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              Delete All
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg ml-auto transition-colors">
              Clear
            </button>
            {bulkActionLoading && <Loader2 className="w-4 h-4 animate-spin text-brand-red" />}
          </motion.div>
        )}
      </div>

      {/* Events table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-brand-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-bold text-slate-700 text-lg mb-1">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all' ? 'No matching events' : 'No events yet'}
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first event to get started'}
          </p>
          {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> Create Your First Event
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-brand-border">
                  <th className="px-3 py-2.5 w-10">
                    <button onClick={toggleSelectAll} className="p-0.5 text-slate-400 hover:text-slate-600">
                      {selectedIds.size === filtered.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700"
                    onClick={() => toggleSort('title')}>
                    <div className="flex items-center">Title <SortIcon field="title" /></div>
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer select-none hover:text-slate-700"
                    onClick={() => toggleSort('start_datetime')}>
                    <div className="flex items-center">Date <SortIcon field="start_datetime" /></div>
                  </th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700"
                    onClick={() => toggleSort('status')}>
                    <div className="flex items-center justify-center">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">Visibility</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Active</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {paged.map((e, i) => (
                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`hover:bg-slate-50/70 transition-colors ${selectedIds.has(e.id) ? 'bg-brand-red/[0.02]' : ''}`}
                  >
                    <td className="px-3 py-2.5">
                      <button onClick={() => toggleSelect(e.id)} className="p-0.5 text-slate-400 hover:text-slate-600">
                        {selectedIds.has(e.id) ? <CheckSquare className="w-4 h-4 text-brand-red" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <EventThumb event={e} />
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-slate-900 block truncate max-w-[200px]">{e.title}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {e.location}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeBadge(e.event_type)}`}>{e.event_type}</span>
                            {e.branch_name && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {e.branch_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formattedDate(e.start_datetime)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span>{formattedDate(e.end_datetime)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(e.status)}`}>{e.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center hidden md:table-cell">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${visibilityBadge(e.visibility)}`}>{e.visibility}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        e.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {e.is_active ? <CheckCircle className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                        {e.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(e)}
                          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50 transition-colors"
                          title="Edit"
                          aria-label="Edit event"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePublish(e.id)}
                          className={`p-2 rounded-xl border transition-colors ${
                            e.status === 'PUBLISHED'
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={e.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          aria-label={e.status === 'PUBLISHED' ? 'Unpublish event' : 'Publish event'}
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(e.id, e.is_active)}
                          className={`p-2 rounded-xl border transition-colors ${
                            e.is_active
                              ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                              : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                          title={e.is_active ? 'Deactivate' : 'Activate'}
                          aria-label={e.is_active ? 'Deactivate event' : 'Activate event'}
                        >
                          {e.is_active ? <Archive className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={ev => openMenu(ev, e)}
                          className={`p-2 rounded-xl border transition-all ${
                            menuEvent?.id === e.id
                              ? 'bg-brand-red/5 text-brand-red border-brand-red/20 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:shadow-sm'
                          }`}
                          title="More"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-slate-50/50">
              <span className="text-[11px] text-slate-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                  const pIdx = start + i;
                  if (pIdx >= totalPages) return null;
                  return (
                    <button key={pIdx} onClick={() => setPage(pIdx)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                        pIdx === page ? 'bg-brand-red text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      {pIdx + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!saving) setShowForm(false); }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center">
                    {editingId ? <Edit3 className="w-5 h-5 text-brand-red" /> : <Sparkles className="w-5 h-5 text-brand-red" />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{editingId ? 'Edit Event' : 'Create Event'}</h3>
                    <p className="text-xs text-slate-500">{editingId ? 'Update event details' : 'Set up a new event, tournament, or workshop'}</p>
                  </div>
                </div>
                <button onClick={() => { if (!saving) setShowForm(false); }} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-brand-red/10 flex items-center justify-center"><Tag className="w-3 h-3 text-brand-red" /></div>
                    <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">Event Type</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {EVENT_TYPE_OPTIONS.map(renderTypeCard)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-brand-red/10 flex items-center justify-center"><FileText className="w-3 h-3 text-brand-red" /></div>
                    <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">Basic Information</h4>
                  </div>
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Title *</label>
                      <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. VEX Robotics Competition 2026"
                        className={inputClass('title')} />
                      {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Description</label>
                      <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        rows={3} placeholder="Describe the event, agenda, requirements..."
                        className={inputClass('description')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Branch</label>
                        <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                          <option value="">All Branches (Global)</option>
                          {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Location *</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                            placeholder="e.g. Addis Ababa, Ethiopia"
                            className={`${inputClass('location')} pl-10`} />
                        </div>
                        {errors.location && <p className="text-[10px] text-red-500 mt-1">{errors.location}</p>}
                      </div>
                    </div>
                    {/* Banner / Thumbnail */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Banner Image</label>
                      <div className="flex items-start gap-4">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-dashed border-brand-border rounded-xl hover:border-brand-red/40 transition-colors">
                            <Image className="w-5 h-5 text-slate-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700">
                                {form.banner instanceof File ? form.banner.name : 'Click to upload banner'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Recommended: 1200×600px · Max 5MB</p>
                            </div>
                          </div>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setForm(p => ({ ...p, banner: file, bannerPreview: URL.createObjectURL(file) }));
                              }
                            }} />
                        </label>
                        {(form.bannerPreview || form.banner instanceof File) && (
                          <div className="relative shrink-0">
                            <img src={form.banner instanceof File ? form.bannerPreview : form.bannerPreview}
                              alt="banner preview" className="w-20 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50" />
                            <button type="button" onClick={() => setForm(p => ({ ...p, banner: null, bannerPreview: '' }))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-brand-red/10 flex items-center justify-center"><Clock className="w-3 h-3 text-brand-red" /></div>
                    <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">Schedule</h4>
                  </div>
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Start Date & Time *</label>
                        <input type="datetime-local" value={form.start_datetime}
                          onChange={e => setForm(p => ({ ...p, start_datetime: e.target.value }))}
                          className={inputClass('start_datetime')} />
                        {errors.start_datetime && <p className="text-[10px] text-red-500 mt-1">{errors.start_datetime}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">End Date & Time *</label>
                        <input type="datetime-local" value={form.end_datetime}
                          onChange={e => setForm(p => ({ ...p, end_datetime: e.target.value }))}
                          className={inputClass('end_datetime')} />
                        {errors.end_datetime && <p className="text-[10px] text-red-500 mt-1">{errors.end_datetime}</p>}
                      </div>
                    </div>
                    {form.start_datetime && form.end_datetime && form.start_datetime < form.end_datetime && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white rounded-lg px-3 py-2 border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        Duration: {Math.ceil((new Date(form.end_datetime).getTime() - new Date(form.start_datetime).getTime()) / (1000 * 60 * 60))} hours
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-brand-red/10 flex items-center justify-center"><Users className="w-3 h-3 text-brand-red" /></div>
                    <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">Registration</h4>
                  </div>
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-4">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${form.registration_enabled ? 'bg-brand-red' : 'bg-slate-300'}`}
                          onClick={() => setForm(p => ({ ...p, registration_enabled: !p.registration_enabled }))}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${form.registration_enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">Enable Registration</span>
                      </label>
                      <label className={`flex items-center gap-2.5 cursor-pointer select-none ${!form.registration_enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${form.payment_required ? 'bg-brand-red' : 'bg-slate-300'}`}
                          onClick={() => setForm(p => ({ ...p, payment_required: !p.payment_required }))}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${form.payment_required ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">Payment Required</span>
                      </label>
                    </div>

                    {form.registration_enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Registration Mode</label>
                          <select value={form.registration_mode}
                            onChange={e => setForm(p => ({ ...p, registration_mode: e.target.value as eventsApi.RegistrationMode }))}
                            className="w-full px-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                            {REGISTRATION_MODES.map(m => <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Registration Deadline</label>
                          <input type="datetime-local" value={form.registration_deadline}
                            onChange={e => setForm(p => ({ ...p, registration_deadline: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                        </div>
                        {form.payment_required && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Registration Fee</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="number" value={form.registration_fee}
                                onChange={e => setForm(p => ({ ...p, registration_fee: e.target.value }))}
                                placeholder="0.00" className="w-full pl-9 pr-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Capacity</label>
                          <input type="number" value={form.capacity}
                            onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                            placeholder="Unlimited" className={inputClass('capacity')} />
                          {errors.capacity && <p className="text-[10px] text-red-500 mt-1">{errors.capacity}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-brand-red/10 flex items-center justify-center"><Settings className="w-3 h-3 text-brand-red" /></div>
                    <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">Advanced Settings</h4>
                  </div>
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Visibility</label>
                        <div className="grid grid-cols-2 gap-2">
                          {VISIBILITY_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const isActive = form.visibility === opt.value;
                            return (
                              <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, visibility: opt.value }))}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                  isActive ? 'border-brand-red bg-brand-red/5 text-brand-red' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">YouTube Live URL</label>
                        <div className="relative">
                          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input value={form.youtube_live_url}
                            onChange={e => setForm(p => ({ ...p, youtube_live_url: e.target.value }))}
                            placeholder="https://youtube.com/watch?v=..."
                            className={`${inputClass('youtube_live_url')} pl-10`} />
                        </div>
                        {errors.youtube_live_url && <p className="text-[10px] text-red-500 mt-1">{errors.youtube_live_url}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {form.title && (
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center shrink-0">
                        {form.event_type === 'TOURNAMENT' ? <Trophy className="w-5 h-5 text-purple-600" /> :
                         form.event_type === 'WORKSHOP' ? <GraduationCap className="w-5 h-5 text-cyan-600" /> :
                         <Calendar className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{form.title}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {form.location || 'Location TBD'}
                          <span className="mx-1">·</span>
                          <span>{EVENT_TYPE_OPTIONS.find(o => o.value === form.event_type)?.label}</span>
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">DRAFT</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-brand-border">
                <button onClick={() => setShowForm(false)} disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.title || !form.start_datetime || !form.end_datetime}
                  className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-brand-red to-brand-red-dark rounded-xl shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 min-w-[120px] justify-center">
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : editingId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Event" maxWidth="max-w-md">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
          <h4 className="font-bold text-lg text-slate-900 mb-2">Delete "{deleteTarget?.title}"?</h4>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            This action cannot be undone. All associated tournaments, teams, matches, and registrations will also be removed.
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={() => setDeleteTarget(null)}
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="flex-1 px-4 py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/25 transition-all">
              Delete Event
            </button>
          </div>
        </div>
      </Modal>

      {/* Actions dropdown portal — rendered at document.body, never clipped */}
      {renderActionsDropdown()}
    </div>
  );
}
