import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Image, Video, Plus, Edit2, Trash2, X, Search, Upload, Eye, EyeOff, Play, ExternalLink } from 'lucide-react';
import { api, GalleryItem } from '../api/cmsApi';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const CATEGORIES = [
  { value: 'EVENT', label: 'Event' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'CAMPUS', label: 'Campus' },
  { value: 'OTHER', label: 'Other' },
];

type MediaType = 'image' | 'video';

const emptyForm = (): Partial<GalleryItem> & { mediaType: MediaType } => ({
  title: '', description: '', imageUrl: '', videoUrl: '', category: 'EVENT', isActive: true, mediaType: 'image',
});

function getYoutubeEmbed(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function isVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export default function GalleryManager({ addToast }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Partial<GalleryItem> & { mediaType?: MediaType }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<GalleryItem | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditing(prev => prev ? { ...prev, imageUrl: reader.result as string, mediaType: 'image' } : prev);
    reader.readAsDataURL(file);
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<GalleryItem>('gallery')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const mediaType = editing?.mediaType ?? (editing?.videoUrl ? 'video' : 'image');

  const openCreate = () => { setEditing({ ...emptyForm() }); setFormErrors({}); };
  const openEdit = (item: GalleryItem) => {
    const mt = item.videoUrl ? 'video' : 'image';
    setEditing({ ...item, mediaType: mt });
    setFormErrors({});
  };
  const closeForm = () => { setEditing(null); setFormErrors({}); };

  const clearError = (field: string) => { if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' })); };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editing?.title?.trim()) errors.title = 'Title is required';
    if (!editing?.description?.trim()) errors.description = 'Description is required';
    if (mediaType === 'image' && !editing?.imageUrl?.trim()) errors.imageUrl = 'Image URL is required';
    if (mediaType === 'video' && !editing?.videoUrl?.trim()) errors.videoUrl = 'Video URL is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    const payload = {
      ...editing,
      ...(mediaType === 'image' ? { videoUrl: '' } : { imageUrl: '' }),
    };
    try {
      if (editing.id) {
        await api.update('gallery', editing.id, payload);
        addToast('Gallery item updated', 'success');
      } else {
        await api.create('gallery', payload);
        addToast('Gallery item created', 'success');
      }
      closeForm();
      load();
    } catch (e: any) { addToast(e?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const remove = async (id: number | string) => {
    if (!confirm('Delete this gallery item?')) return;
    try { await api.delete('gallery', id); addToast('Deleted', 'success'); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: GalleryItem) => {
    try { await api.update('gallery', item.id, { isActive: !item.isActive }); load(); }
    catch { addToast('Update failed', 'error'); }
  };

  const categoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      EVENT: 'bg-blue-100 text-blue-700',
      WORKSHOP: 'bg-purple-100 text-purple-700',
      COMPETITION: 'bg-amber-100 text-amber-700',
      CAMPUS: 'bg-emerald-100 text-emerald-700',
      OTHER: 'bg-slate-100 text-slate-700',
    };
    return colors[cat] ?? 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">Gallery</h2>
          {!loading && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} / {items.length}</span>}
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search gallery..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30" />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {items.length === 0 ? 'No gallery items yet' : 'No items match your search'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {filtered.map(item => (
            <div key={item.id}
              className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setPreview(item)}>
              <div className="aspect-[4/3] bg-slate-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : item.videoUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <Play className="w-12 h-12 text-white/80" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Image className="w-8 h-8 text-slate-300" /></div>
                )}
              </div>
              {item.videoUrl && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Video className="w-2.5 h-2.5" /> Video
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm font-bold truncate">{item.title}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${categoryBadge(item.category)}`}>
                  {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                </span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleActive(item)} className={`p-1 rounded-lg ${item.isActive ? 'bg-white/90 text-slate-600 hover:text-red-500' : 'bg-white/90 text-slate-600 hover:text-emerald-500'}`}>
                  {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(item)} className="p-1 rounded-lg bg-white/90 text-blue-600 hover:bg-white"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(item.id)} className="p-1 rounded-lg bg-white/90 text-red-500 hover:bg-white"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              {!item.isActive && (
                <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Draft</div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Gallery Item' : 'New Gallery Item'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Title <span className="text-red-400 ml-0.5">*</span></label>
                <input value={editing.title ?? ''} onChange={e => { setEditing({ ...editing, title: e.target.value }); clearError('title'); }}
                  placeholder="e.g. VEX Robotics Championship 2025"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${formErrors.title ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
                {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description <span className="text-red-400 ml-0.5">*</span></label>
                <textarea value={editing.description ?? ''} onChange={e => { setEditing({ ...editing, description: e.target.value }); clearError('description'); }}
                  rows={3} placeholder="Brief description..."
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none ${formErrors.description ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
                {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
              </div>

              {/* Media type selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Media Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing({ ...editing, mediaType: 'image', videoUrl: '' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${mediaType === 'image' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                    <Image className="w-4 h-4" /> Image
                  </button>
                  <button type="button" onClick={() => setEditing({ ...editing, mediaType: 'video', imageUrl: '' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${mediaType === 'video' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                    <Video className="w-4 h-4" /> Video
                  </button>
                </div>
              </div>

              {mediaType === 'image' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Image <span className="text-red-400 ml-0.5">*</span></label>
                      <input value={editing.imageUrl ?? ''} onChange={e => { setEditing({ ...editing, imageUrl: e.target.value }); clearError('imageUrl'); }}
                        placeholder="https://example.com/photo.jpg"
                        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${formErrors.imageUrl ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
                      {formErrors.imageUrl && <p className="text-xs text-red-500 mt-1">{formErrors.imageUrl}</p>}
                    </div>
                    <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                    <button type="button" onClick={() => imageInputRef.current?.click()}
                      className="mt-5 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600" title="Upload image">
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  {editing.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <img src={editing.imageUrl} alt="" className="w-full h-40 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </>
              )}

              {mediaType === 'video' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Video URL <span className="text-red-400 ml-0.5">*</span></label>
                    <input value={editing.videoUrl ?? ''} onChange={e => { setEditing({ ...editing, videoUrl: e.target.value }); clearError('videoUrl'); }}
                      placeholder="https://youtube.com/watch?v=..."
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${formErrors.videoUrl ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
                    {formErrors.videoUrl && <p className="text-xs text-red-500 mt-1">{formErrors.videoUrl}</p>}
                  </div>
                  {editing.videoUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 flex items-center justify-center">
                      <Video className="w-10 h-10 text-white/60" />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                <select value={editing.category ?? 'EVENT'} onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editing.isActive ?? true} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="rounded" />
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-slate-200 sticky bottom-0 bg-white">
              <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview lightbox */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-black rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
              <X className="w-5 h-5" />
            </button>
            {preview.videoUrl ? (
              <>
                {getYoutubeEmbed(preview.videoUrl) ? (
                  <iframe src={getYoutubeEmbed(preview.videoUrl)!} title={preview.title}
                    className="w-full aspect-video" allowFullScreen allow="autoplay; encrypted-media" />
                ) : (
                  <div className="w-full aspect-video flex flex-col items-center justify-center gap-3 text-white/70">
                    <Video className="w-16 h-16" />
                    <a href={preview.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline text-sm">
                      <ExternalLink className="w-4 h-4" /> Open video
                    </a>
                  </div>
                )}
              </>
            ) : (
              <img src={preview.imageUrl ?? ''} alt={preview.title} className="w-full max-h-[85vh] object-contain" />
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
              <h3 className="text-white font-bold text-lg">{preview.title}</h3>
              <p className="text-white/70 text-sm mt-1">{preview.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
