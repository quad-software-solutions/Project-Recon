import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MessageSquareQuote, Plus, Edit2, Trash2, X, Search, Upload, Eye, EyeOff,
  Play, LayoutGrid, List, GripVertical, CheckSquare, Square, ChevronLeft,
  ChevronRight, AlertCircle, RefreshCw, Image as ImageIcon, Video, Quote,
} from 'lucide-react';
import { api, Testimonial, GalleryItem } from '../api/cmsApi';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

/** Backend `role` is a free CharField — single-select category values. */
const ROLE_OPTIONS = [
  'Student Success',
  'Alumni',
  'Parent',
  'Teacher',
  'Industry Partner',
  'Competition Winner',
  'Workshop',
  'Training',
  'Internship',
  'Other',
] as const;

const PAGE_SIZE = 12;
const ACCEPTED_IMAGE = 'image/jpeg,image/png,image/webp';

type ViewMode = 'list' | 'grid';
type SortKey = 'order' | 'name' | 'created_at';
type StatusFilter = 'all' | 'published' | 'draft';
type MediaPicker = 'image' | 'video' | null;

const emptyForm = (): Partial<Testimonial> => ({
  name: '',
  role: ROLE_OPTIONS[0],
  quote: '',
  imageUrl: '',
  videoUrl: '',
  isActive: true,
  priority: 0,
});

function isActive(item: Partial<Testimonial>): boolean {
  return item.isActive ?? item.is_active ?? false;
}

function imageOf(item: Partial<Testimonial>): string {
  return (item.imageUrl || item.image || '') as string;
}

function videoOf(item: Partial<Testimonial>): string {
  return (item.videoUrl || item.video_url || '') as string;
}

function orderOf(item: Partial<Testimonial>): number {
  return item.priority ?? item.order ?? 0;
}

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TestimonialManager({ addToast }: Props) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [preview, setPreview] = useState<Testimonial | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('order');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [mediaPicker, setMediaPicker] = useState<MediaPicker>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setItems(await api.getAll<Testimonial>('testimonials'));
    } catch {
      setItems([]);
      setLoadError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const roles = useMemo(() => {
    const set = new Set<string>(ROLE_OPTIONS);
    items.forEach(i => { if (i.role) set.add(i.role); });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter(item => {
      if (roleFilter && item.role !== roleFilter) return false;
      if (statusFilter === 'published' && !isActive(item)) return false;
      if (statusFilter === 'draft' && isActive(item)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.role?.toLowerCase().includes(q) ||
        item.quote?.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'order') cmp = orderOf(a) - orderOf(b);
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = (a.created_at ?? '').localeCompare(b.created_at ?? '');
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [items, search, roleFilter, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe],
  );

  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, sortKey, sortAsc]);

  const openCreate = () => {
    const nextOrder = items.reduce((max, i) => Math.max(max, orderOf(i)), -1) + 1;
    setEditing({ ...emptyForm(), priority: nextOrder });
    setFormErrors({});
  };
  const openEdit = (item: Testimonial) => {
    setEditing({
      ...item,
      imageUrl: imageOf(item),
      videoUrl: videoOf(item),
      priority: orderOf(item),
      isActive: isActive(item),
    });
    setFormErrors({});
  };
  const closeForm = () => { setEditing(null); setFormErrors({}); setMediaPicker(null); };

  const clearError = (field: string) => {
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editing?.name?.trim()) errors.name = 'Full name is required';
    if (!editing?.role?.trim()) errors.role = 'Category is required';
    if (!editing?.quote?.trim()) errors.quote = 'Review is required';
    const img = imageOf(editing ?? {});
    const vid = videoOf(editing ?? {});
    if (img && !img.startsWith('data:') && !isHttpsUrl(img)) {
      errors.imageUrl = 'Image must be an HTTPS URL';
    }
    if (vid && !isHttpsUrl(vid)) {
      errors.videoUrl = 'Video must be an HTTPS URL';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    const payload = {
      name: editing.name!.trim(),
      role: editing.role!.trim(),
      quote: editing.quote!.trim(),
      imageUrl: imageOf(editing) || null,
      videoUrl: videoOf(editing) || null,
      priority: orderOf(editing),
      isActive: isActive(editing),
    };
    try {
      if (editing.id) {
        await api.update('testimonials', editing.id, payload);
        addToast('Testimonial updated', 'success');
      } else {
        await api.create('testimonials', payload);
        addToast('Testimonial created', 'success');
      }
      closeForm();
      load();
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Save failed', 'error');
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return;
    try {
      await api.delete('testimonials', id);
      addToast('Testimonial deleted', 'success');
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      load();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const toggleActive = async (item: Testimonial) => {
    try {
      await api.update('testimonials', item.id, { isActive: !isActive(item) });
      load();
    } catch {
      addToast('Update failed', 'error');
    }
  };

  const openGalleryPicker = async (kind: 'image' | 'video') => {
    setMediaPicker(kind);
    setGalleryLoading(true);
    try {
      setGalleryItems(await api.getAll<GalleryItem>('gallery'));
    } catch {
      setGalleryItems([]);
      addToast('Failed to load gallery media', 'error');
    }
    setGalleryLoading(false);
  };

  const pickGalleryMedia = (item: GalleryItem) => {
    if (mediaPicker === 'image') {
      const url = item.imageUrl || item.image;
      if (!url) return;
      setEditing(prev => prev ? { ...prev, imageUrl: url } : prev);
      clearError('imageUrl');
    } else if (mediaPicker === 'video') {
      const url = item.videoUrl || item.video_url;
      if (!url) return;
      setEditing(prev => prev ? { ...prev, videoUrl: url } : prev);
      clearError('videoUrl');
    }
    setMediaPicker(null);
  };

  /** Upload one image via gallery ImageField, then attach returned HTTPS URL. */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editing) return;
    if (!ACCEPTED_IMAGE.split(',').includes(file.type)) {
      addToast('Only JPG, PNG, or WEBP images are accepted', 'error');
      return;
    }
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const created = await api.create<GalleryItem>('gallery', {
        title: `Testimonial — ${editing.name || file.name}`,
        description: 'Media uploaded for testimonial',
        imageUrl: dataUri,
        videoUrl: '',
        isActive: false,
      });
      const url = created.imageUrl || created.image;
      if (!url) throw new Error('Upload succeeded but no image URL returned');
      setEditing(prev => prev ? { ...prev, imageUrl: url } : prev);
      clearError('imageUrl');
      addToast('Image uploaded', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Image upload failed', 'error');
    }
    setUploadingImage(false);
  };

  const removeImage = () => {
    setEditing(prev => prev ? { ...prev, imageUrl: '', image: null } : prev);
  };

  const removeVideo = () => {
    setEditing(prev => prev ? { ...prev, videoUrl: '', video_url: null } : prev);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    const ids = pageItems.map(i => i.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const runBulk = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selected.size === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selected.size} testimonial(s)?`)) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map(id => {
        if (action === 'delete') return api.delete('testimonials', id);
        return api.update('testimonials', id, { isActive: action === 'publish' });
      }));
      addToast(
        action === 'delete' ? `Deleted ${ids.length} testimonial(s)` :
        action === 'publish' ? `Published ${ids.length} testimonial(s)` :
        `Unpublished ${ids.length} testimonial(s)`,
        'success',
      );
      setSelected(new Set());
      load();
    } catch {
      addToast('Bulk action failed', 'error');
    }
    setBulkBusy(false);
  };

  const canReorder = sortKey === 'order' && sortAsc && !search && !roleFilter && statusFilter === 'all';

  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId || !canReorder) { setDragId(null); return; }
    const ordered = [...filtered];
    const fromIdx = ordered.findIndex(i => i.id === dragId);
    const toIdx = ordered.findIndex(i => i.id === targetId);
    if (fromIdx < 0 || toIdx < 0) { setDragId(null); return; }
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    const updates = ordered.map((item, idx) => ({ ...item, priority: idx, order: idx }));
    setItems(prev => {
      const map = new Map(updates.map(u => [u.id, u]));
      return prev.map(i => map.get(i.id) ?? i);
    });
    setDragId(null);
    try {
      const changed = updates.filter(u => {
        const prev = items.find(i => i.id === u.id);
        return orderOf(prev ?? {}) !== u.priority;
      });
      if (changed.length > 0) {
        await Promise.all(changed.map(u => api.update('testimonials', u.id, { priority: u.priority })));
      }
    } catch {
      addToast('Failed to save order', 'error');
      load();
    }
  };

  const formImage = editing ? imageOf(editing) : '';
  const formVideo = editing ? videoOf(editing) : '';
  const galleryChoices = mediaPicker === 'image'
    ? galleryItems.filter(g => !!(g.imageUrl || g.image))
    : galleryItems.filter(g => !!(g.videoUrl || g.video_url));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">Testimonials</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
            About page
          </span>
          {!loading && !loadError && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {filtered.length} / {items.length}
            </span>
          )}
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Testimonial
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-100 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search testimonials..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="">All Categories</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={`${sortKey}:${sortAsc ? 'asc' : 'desc'}`}
          onChange={e => {
            const [k, dir] = e.target.value.split(':') as [SortKey, string];
            setSortKey(k);
            setSortAsc(dir === 'asc');
          }}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="order:asc">Order ↑</option>
          <option value="order:desc">Order ↓</option>
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="created_at:desc">Newest</option>
          <option value="created_at:asc">Oldest</option>
        </select>
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-blue-50/60 flex-wrap">
          <span className="text-xs font-bold text-blue-700">{selected.size} selected</span>
          <button disabled={bulkBusy} onClick={() => runBulk('publish')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Publish</button>
          <button disabled={bulkBusy} onClick={() => runBulk('unpublish')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">Unpublish</button>
          <button disabled={bulkBusy} onClick={() => runBulk('delete')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">Delete</button>
          <button onClick={() => setSelected(new Set())} className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-white">Clear</button>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <SkeletonList viewMode={viewMode} />
      ) : loadError ? (
        <div className="p-10 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-red-300 mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">Couldn&apos;t load testimonials</p>
          <p className="text-xs text-slate-400 mb-4">Check your connection and try again.</p>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center">
          <MessageSquareQuote className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {items.length === 0 ? 'No testimonials available.' : 'No testimonials match your search'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="divide-y divide-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <button type="button" onClick={toggleSelectAllPage} className="p-0.5 text-slate-400 hover:text-blue-600" title="Select page">
              {pageItems.every(i => selected.has(i.id)) && pageItems.length > 0
                ? <CheckSquare className="w-4 h-4" />
                : <Square className="w-4 h-4" />}
            </button>
            {canReorder && <span className="w-4" />}
            <span className="w-10">Media</span>
            <span className="flex-1">Name / Category</span>
            <span className="hidden sm:block w-16 text-center">Order</span>
            <span className="hidden md:block w-24">Date</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-28 text-right">Actions</span>
          </div>
          {pageItems.map(item => (
            <div
              key={item.id}
              draggable={canReorder}
              onDragStart={() => onDragStart(item.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(item.id)}
              className={`flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors ${dragId === item.id ? 'opacity-50 bg-blue-50' : ''}`}
            >
              <button type="button" onClick={() => toggleSelect(item.id)} className="p-0.5 text-slate-400 hover:text-blue-600 shrink-0">
                {selected.has(item.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
              </button>
              {canReorder && (
                <span className="shrink-0 cursor-grab text-slate-300" title="Drag to reorder">
                  <GripVertical className="w-4 h-4" />
                </span>
              )}
              <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden relative">
                {imageOf(item) ? (
                  <img src={imageOf(item)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MessageSquareQuote className="w-5 h-5 text-slate-400" />
                )}
                {videoOf(item) && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Play className="w-2.5 h-2.5" fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                  {item.role && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
                      {item.role}
                    </span>
                  )}
                  {videoOf(item) && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                      <Play className="w-2.5 h-2.5" /> Video
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{item.quote}</p>
              </div>
              <span className="hidden sm:block w-16 text-center text-xs text-slate-400 tabular-nums">{orderOf(item)}</span>
              <span className="hidden md:block w-24 text-xs text-slate-400">{formatDate(item.created_at)}</span>
              <div className="flex items-center gap-1 shrink-0 w-20 justify-center">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive(item) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>{isActive(item) ? 'Published' : 'Draft'}</span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 w-28 justify-end">
                <button onClick={() => setPreview(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Preview">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleActive(item)} className={`p-1.5 rounded-lg transition-colors ${isActive(item) ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={isActive(item) ? 'Unpublish' : 'Publish'}>
                  {isActive(item) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {pageItems.map(item => (
            <div key={item.id} className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:shadow-md transition-shadow group">
              <button
                type="button"
                onClick={() => toggleSelect(item.id)}
                className="absolute top-2 left-2 z-10 p-0.5 rounded bg-white/90 text-slate-400 hover:text-blue-600"
              >
                {selected.has(item.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => setPreview(item)} className="block w-full text-left">
                <div className="aspect-video bg-slate-100 relative">
                  {videoOf(item) ? (
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                      {imageOf(item) && <img src={imageOf(item)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                      <Play className="w-10 h-10 text-white relative z-10" fill="currentColor" />
                    </div>
                  ) : imageOf(item) ? (
                    <img src={imageOf(item)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
                      <Quote className="w-8 h-8 text-blue-300" />
                    </div>
                  )}
                </div>
              </button>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-800 truncate flex-1">{item.name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive(item) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>{isActive(item) ? 'Published' : 'Draft'}</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.role}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{formatDate(item.created_at)}</span>
                  <span>#{orderOf(item)}</span>
                </div>
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleActive(item)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white" title={isActive(item) ? 'Unpublish' : 'Publish'}>
                    {isActive(item) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-blue-500 hover:bg-white"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-white"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !loadError && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Page {pageSafe} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={pageSafe <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pageSafe >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Testimonial' : 'New Testimonial'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Field
                label="Full Name"
                value={editing.name ?? ''}
                onChange={v => { setEditing({ ...editing, name: v }); clearError('name'); }}
                error={formErrors.name}
                required
                placeholder="e.g. Hanna Bekele"
              />

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Category <span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={editing.role ?? ''}
                  onChange={e => { setEditing({ ...editing, role: e.target.value }); clearError('role'); }}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${formErrors.role ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-500/30'}`}
                >
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  {editing.role && !(ROLE_OPTIONS as readonly string[]).includes(editing.role) && (
                    <option value={editing.role}>{editing.role}</option>
                  )}
                </select>
                {formErrors.role && <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>}
                <p className="text-[10px] text-slate-400 mt-1">One category only (stored as role).</p>
              </div>

              <Textarea
                label="Review"
                value={editing.quote ?? ''}
                onChange={v => { setEditing({ ...editing, quote: v }); clearError('quote'); }}
                error={formErrors.quote}
                required
                placeholder="Their testimonial quote..."
              />

              {/* Media card — single image, single video */}
              <div className="rounded-xl border border-slate-200 p-3 space-y-4 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-500 uppercase">Media</p>

                {/* Image — choose one */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Image <span className="font-normal text-slate-400">(choose one)</span>
                    </label>
                    {formImage && (
                      <button type="button" onClick={removeImage} className="text-[10px] font-bold text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={formImage.startsWith('data:') ? '' : formImage}
                      onChange={e => { setEditing({ ...editing, imageUrl: e.target.value }); clearError('imageUrl'); }}
                      placeholder="https://… image URL"
                      className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${formErrors.imageUrl ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-500/30'}`}
                    />
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE}
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 disabled:opacity-50"
                      title="Upload JPG, PNG, or WEBP"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openGalleryPicker('image')}
                      className="px-2 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white whitespace-nowrap"
                    >
                      Gallery
                    </button>
                  </div>
                  {formErrors.imageUrl && <p className="text-xs text-red-500 mt-1">{formErrors.imageUrl}</p>}
                  {uploadingImage && <p className="text-xs text-slate-400 mt-1">Uploading…</p>}
                  {formImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 p-3 flex items-center justify-center bg-white">
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                {/* Video — choose one */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Video <span className="font-normal text-slate-400">(choose one)</span>
                    </label>
                    {formVideo && (
                      <button type="button" onClick={removeVideo} className="text-[10px] font-bold text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={formVideo}
                      onChange={e => { setEditing({ ...editing, videoUrl: e.target.value }); clearError('videoUrl'); }}
                      placeholder="https://… YouTube, Vimeo, or mp4"
                      className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${formErrors.videoUrl ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-500/30'}`}
                    />
                    <button
                      type="button"
                      onClick={() => openGalleryPicker('video')}
                      className="px-2 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white whitespace-nowrap"
                    >
                      Gallery
                    </button>
                  </div>
                  {formErrors.videoUrl && <p className="text-xs text-red-500 mt-1">{formErrors.videoUrl}</p>}
                  {formVideo && <VideoPreview url={formVideo} poster={formImage || undefined} />}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={orderOf(editing)}
                  onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive(editing)}
                  onChange={e => setEditing({ ...editing, isActive: e.target.checked })}
                  className="rounded"
                />
                Published
              </label>

              {editing.created_at && (
                <p className="text-xs text-slate-400">Created {formatDate(editing.created_at)}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-slate-200 sticky bottom-0 bg-white">
              <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button
                onClick={save}
                disabled={saving || uploadingImage}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery media picker (single select) */}
      {mediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setMediaPicker(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">
                Select {mediaPicker === 'image' ? 'one image' : 'one video'}
              </h3>
              <button onClick={() => setMediaPicker(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {galleryLoading ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading gallery…</p>
              ) : galleryChoices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No {mediaPicker === 'image' ? 'images' : 'videos'} in gallery.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryChoices.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => pickGalleryMedia(g)}
                      className="text-left border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:ring-2 hover:ring-blue-500/20 transition-all"
                    >
                      <div className="aspect-video bg-slate-100 flex items-center justify-center">
                        {mediaPicker === 'image' ? (
                          <img src={g.imageUrl || g.image || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <Play className="w-8 h-8 text-white/80" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-700 p-2 truncate">{g.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public-site preview */}
      {preview && (
        <PublicPreview item={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

function SkeletonList({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="aspect-video bg-slate-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-4 h-4 rounded bg-slate-200" />
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
          <div className="h-5 w-16 bg-slate-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function VideoPreview({ url, poster }: { url: string; poster?: string }) {
  const embed = getVideoEmbed(url);
  if (embed) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
        <iframe src={embed} title="Video preview" className="w-full h-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (isDirectVideo(url)) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
        <video controls className="w-full h-full object-contain" src={url} poster={poster} />
      </div>
    );
  }
  return (
    <div className="mt-2 rounded-xl border border-slate-200 aspect-video bg-slate-900 flex items-center justify-center">
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:underline flex items-center gap-2">
        <Play className="w-4 h-4" /> Open video URL
      </a>
    </div>
  );
}

/** Mirrors the public About page testimonial card. */
function PublicPreview({ item, onClose }: { item: Testimonial; onClose: () => void }) {
  const video = videoOf(item);
  const image = imageOf(item);
  const embed = video ? getVideoEmbed(video) : null;
  const direct = video ? isDirectVideo(video) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-white shadow text-slate-600 hover:bg-slate-50">
          <X className="w-4 h-4" />
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {embed ? (
            <div className="relative aspect-video bg-slate-900">
              <iframe
                src={embed}
                title={`${item.name} testimonial`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : direct && video ? (
            <div className="relative aspect-video bg-slate-900">
              <video controls className="absolute inset-0 w-full h-full object-cover" src={video} poster={image || undefined} />
            </div>
          ) : video ? (
            <a
              href={video}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-video bg-slate-900 flex items-center justify-center"
            >
              {image && <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
              <span className="relative z-10 w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-blue-600 ml-0.5" fill="currentColor" />
              </span>
            </a>
          ) : image ? (
            <div className="aspect-video bg-slate-100 overflow-hidden">
              <img src={image} alt={item.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[5/2] bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
              <Quote className="w-10 h-10 text-blue-300" />
            </div>
          )}
          <div className="p-6 flex flex-col flex-1">
            <p className="text-slate-700 text-sm leading-relaxed flex-1 mb-6">&ldquo;{item.quote}&rdquo;</p>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              {image ? (
                <img src={image} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {item.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">{item.name}</h3>
                <span className="text-slate-500 text-xs">{item.role}</span>
              </div>
              {video && (
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <Play className="w-3 h-3" /> Video
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-white/70 mt-3 font-medium uppercase tracking-wider">Public website preview</p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, error, required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-500/30'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Textarea({
  label, value, onChange, error, required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${error ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-500/30'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
