import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit2, Trash2, Search, X, Image, Package, Tag, DollarSign, Eye,
  Archive, RotateCcw, Power, Ruler, Hash, AlertCircle, Building2, Link,
  Layers, Barcode, FileText,
} from 'lucide-react';
import { storeAdminApi, type ProductPayload } from '../api/storeAdminApi';
import { branchesApi } from '@/domains/user/shared/api/adminApi';
import type { Product, ProductCategory } from '@/domains/store/model/types';
import { formatMoney } from '@/domains/store/utils/formatMoney';
import { cn } from '@/shared/utils/cn';

interface Props {
  addToast: (message: string, type: 'success' | 'error') => void;
}

const emptyForm = () => ({
  category: '', name: '', slug: '', short_description: '', description: '',
  sku: '', barcode: '', price: '' as unknown as number, weight: '' as unknown as number, is_active: true,
});

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueSlug(base: string): string {
  return `${base}-${Math.random().toString(36).substring(2, 6)}`;
}

export default function ProductManager({ addToast }: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [initialBranch, setInitialBranch] = useState('');
  const [initialQuantity, setInitialQuantity] = useState<number | ''>('');
  const [initialMinQuantity, setInitialMinQuantity] = useState<number | ''>('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [data, cats, branchData] = await Promise.all([
        storeAdminApi.products.list(),
        storeAdminApi.categories.list(),
        branchesApi.list(),
      ]);
      setItems(data);
      setCategories(cats);
      setBranches(branchData.map((b: any) => ({ id: b.id || b.uuid, name: b.name })));
    } catch (e: any) {
      addToast(e.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(null);
    setInitialBranch('');
    setInitialQuantity('');
    setInitialMinQuantity('');
    setSlugManuallyEdited(false);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (item: Product) => {
    setForm({
      category: item.category, name: item.name, slug: item.slug,
      short_description: item.short_description || '', description: item.description || '',
      sku: item.sku, barcode: item.barcode || '', price: item.price as unknown as number,
      weight: item.weight as unknown as number, is_active: item.is_active,
    });
    setEditing(item.id);
    setFormError(null);
    setShowModal(true);
  };

  const updateForm = (patch: Partial<ReturnType<typeof emptyForm>>) => {
    setForm(p => ({ ...p, ...patch }));
  };

  const handleSave = async (retrySlug?: string) => {
    setFormError(null);
    if (!form.name.trim()) { setFormError('Product name is required.'); return; }
    if (!form.category) { setFormError('Please select a category.'); return; }
    if (!form.sku.trim()) { setFormError('SKU is required.'); return; }
    const price = Number(form.price);
    if (!(price > 0)) { setFormError('Price must be greater than zero.'); return; }

    const baseSlug = slugify(form.name);
    const payload: ProductPayload = {
      category: form.category,
      name: form.name.trim(),
      slug: retrySlug || form.slug || baseSlug || uniqueSlug('product'),
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      price,
      weight: form.weight ? Number(form.weight) : 0,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (editing) {
        await storeAdminApi.products.update(editing, payload);
        addToast('Product updated successfully', 'success');
        setShowModal(false);
        fetchItems();
      } else {
        const created = await storeAdminApi.products.create(payload);
        if (initialBranch) {
          try {
            await storeAdminApi.inventory.create({
              branch: initialBranch,
              product: created.id,
              quantity: Number(initialQuantity) || 0,
              minimum_quantity: Number(initialMinQuantity) || 0,
            });
          } catch { /* non-fatal */ }
        }
        addToast('Product created successfully', 'success');
        setShowModal(false);
        fetchItems();
      }
    } catch (e: any) {
      const msg = e.message || 'Failed to save product';
      if (!editing && !retrySlug && msg.toLowerCase().includes('slug')) {
        return handleSave(uniqueSlug(baseSlug));
      }
      setFormError(msg);
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await storeAdminApi.products.archive(id);
      addToast('Product archived', 'success');
      setDeleteConfirm(null);
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to archive product', 'error');
    }
  };

  const toggleActive = async (item: Product) => {
    try {
      if (item.is_active) {
        await storeAdminApi.products.deactivate(item.id);
        addToast('Product deactivated', 'success');
      } else {
        await storeAdminApi.products.activate(item.id);
        addToast('Product activated', 'success');
      }
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to update status', 'error');
    }
  };

  const toggleArchive = async (item: Product) => {
    try {
      if (item.archived_at) {
        await storeAdminApi.products.restore(item.id);
        addToast('Product restored', 'success');
      } else {
        await storeAdminApi.products.archive(item.id);
        addToast('Product archived', 'success');
      }
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to archive/restore product', 'error');
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('product', productId);
      fd.append('image', file);
      fd.append('is_primary', '1');
      await storeAdminApi.products.uploadImage(productId, fd);
      addToast('Image uploaded', 'success');
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      await storeAdminApi.products.deleteImage(imageId);
      addToast('Image deleted', 'success');
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to delete image', 'error');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await storeAdminApi.products.setPrimaryImage(imageId);
      addToast('Primary image updated', 'success');
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to set primary image', 'error');
    }
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch = !q || i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) || i.category_name.toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || i.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && i.is_active) ||
      (statusFilter === 'inactive' && !i.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const editingProduct = editing ? items.find(i => i.id === editing) : null;

  const inputClass = "w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue bg-white transition-shadow";
  const labelClass = "block text-xs font-semibold text-brand-muted mb-1.5";
  const sectionClass = "px-6 py-5";
  const sectionTitleClass = "flex items-center gap-2 mb-4";
  const iconBoxClass = "w-6 h-6 rounded-md flex items-center justify-center";

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-ink">Products</h3>
            <p className="text-xs text-brand-muted">{filtered.length} of {items.length} products</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-dark transition-colors shadow-sm shadow-brand-blue/15">
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      <div className="px-5 py-3 border-b border-brand-border/30 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
            <input type="text" placeholder="Search by name, SKU, or category..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue placeholder:text-brand-muted/60" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="flex-1 sm:w-auto px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="flex-1 sm:w-auto px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-brand-muted">
              {search || categoryFilter || statusFilter !== 'all' ? 'No products match your filters' : 'No products yet'}
            </p>
            {!search && !categoryFilter && statusFilter === 'all' && (
              <button onClick={openCreate} className="mt-3 text-sm font-medium text-brand-blue hover:text-brand-blue-dark">
                Create your first product
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map(item => (
                <motion.div key={item.id} layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-brand-border bg-white hover:bg-slate-50/50 transition-all duration-150 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.primary_image?.image ? (
                      <img src={item.primary_image.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-semibold text-brand-ink truncate">{item.name}</p>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold",
                        item.is_active
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      )}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-brand-muted">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.category_name}</span>
                      <span>SKU: {item.sku}</span>
                      <span className="flex items-center gap-1 font-semibold text-brand-ink"><DollarSign className="w-3 h-3" />{Number(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-blue-50 transition-all" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleActive(item)}
                      className={cn("p-2 rounded-lg transition-all", item.is_active ? "text-brand-muted hover:text-orange-600 hover:bg-orange-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50")}
                      title={item.is_active ? 'Deactivate' : 'Activate'}><Power className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleArchive(item)}
                      className="p-2 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-slate-100 transition-all"
                      title={item.archived_at ? 'Restore' : 'Archive'}>
                      {item.archived_at ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setDeleteConfirm(item.id)} className="p-2 rounded-lg text-brand-muted hover:text-red-600 hover:bg-red-50 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl border border-brand-border p-6 w-full max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h4 className="text-base font-bold text-brand-ink text-center mb-1">Delete Product?</h4>
              <p className="text-sm text-brand-muted text-center mb-6">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-brand-muted bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm!)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-sm">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/20 backdrop-blur-sm overflow-y-auto" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-3xl mx-auto mb-12">

              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", editingProduct?.primary_image ? "bg-brand-blue/10" : "bg-amber-50 border border-amber-200")}>
                    <Package className={cn("w-4 h-4", editingProduct?.primary_image ? "text-brand-blue" : "text-amber-500")} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-ink">{editing ? 'Edit Product' : 'New Product'}</h4>
                    {editing && !editingProduct?.primary_image && (
                      <p className="text-[11px] text-amber-600 font-medium">Upload images for store display</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-brand-muted hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-brand-border/50">
                {/* 1. Basic Information */}
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <div className={cn(iconBoxClass, "bg-blue-50 border border-blue-200")}>
                      <FileText className="w-3 h-3 text-blue-500" />
                    </div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Basic Information</h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Product Name *</label>
                      <input type="text" value={form.name}
                        onChange={e => {
                          updateForm({ name: e.target.value });
                          if (!slugManuallyEdited) {
                            updateForm({ slug: slugify(e.target.value) });
                          }
                        }}
                        className={inputClass} placeholder="Enter product name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>
                        <Link className="w-3 h-3 inline mr-1" />Slug
                        <span className="text-brand-muted/60 font-normal ml-1">(auto-generated)</span>
                      </label>
                      <input type="text" value={form.slug}
                        onChange={e => { updateForm({ slug: e.target.value }); setSlugManuallyEdited(true); }}
                        className={cn(inputClass, "font-mono text-xs")} placeholder="url-friendly name" />
                    </div>
                    <div>
                      <label className={labelClass}>Category *</label>
                      <select value={form.category} onChange={e => updateForm({ category: e.target.value })}
                        className={inputClass}>
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Short Description</label>
                      <input type="text" value={form.short_description}
                        onChange={e => updateForm({ short_description: e.target.value })}
                        className={inputClass} placeholder="Brief description" />
                    </div>
                  </div>
                </div>

                {/* 2. Pricing & Identification */}
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <div className={cn(iconBoxClass, "bg-emerald-50 border border-emerald-200")}>
                      <DollarSign className="w-3 h-3 text-emerald-500" />
                    </div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Pricing & Inventory</h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>SKU *</label>
                      <input type="text" value={form.sku}
                        onChange={e => updateForm({ sku: e.target.value })}
                        className={inputClass} placeholder="e.g. RECON-001" />
                    </div>
                    <div>
                      <label className={labelClass}>Barcode</label>
                      <input type="text" value={form.barcode}
                        onChange={e => updateForm({ barcode: e.target.value })}
                        className={inputClass} placeholder="Optional" />
                    </div>
                    <div>
                      <label className={labelClass}>Price *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm font-medium">ETB</span>
                        <input type="number" step="0.01" min="0"
                          value={form.price || ''}
                          onChange={e => updateForm({ price: e.target.value ? (parseFloat(e.target.value) as unknown as number) : ('' as unknown as number) })}
                          className={cn(inputClass, "pl-11")} placeholder="0.00" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Weight (kg)</label>
                      <input type="number" step="0.01" min="0"
                        value={form.weight || ''}
                        onChange={e => updateForm({ weight: e.target.value ? (parseFloat(e.target.value) as unknown as number) : ('' as unknown as number) })}
                        className={inputClass} placeholder="0.00" />
                    </div>
                  </div>
                </div>

                {/* 3. Description */}
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <div className={cn(iconBoxClass, "bg-violet-50 border border-violet-200")}>
                      <Hash className="w-3 h-3 text-violet-500" />
                    </div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Description</h5>
                  </div>
                  <textarea value={form.description}
                    onChange={e => updateForm({ description: e.target.value })}
                    rows={4}
                    className={cn(inputClass, "resize-none")} placeholder="Detailed product description..." />
                </div>

                {/* 4. Status */}
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <div className={cn(iconBoxClass, "bg-amber-50 border border-amber-200")}>
                      <Power className="w-3 h-3 text-amber-500" />
                    </div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Status</h5>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={form.is_active}
                      onChange={e => updateForm({ is_active: e.target.checked })}
                      className="rounded border-brand-border text-brand-blue focus:ring-brand-blue/20" />
                    <div>
                      <span className="text-sm font-medium text-brand-ink">Active</span>
                      <p className="text-xs text-brand-muted">Only active products appear in the storefront</p>
                    </div>
                  </label>
                </div>

                {/* 5. Initial Stock (create only) */}
                {!editing && (
                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>
                      <div className={cn(iconBoxClass, "bg-sky-50 border border-sky-200")}>
                        <Building2 className="w-3 h-3 text-sky-500" />
                      </div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Initial Stock <span className="font-normal normal-case text-brand-muted/60">(optional)</span></h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Branch</label>
                        <select value={initialBranch} onChange={e => setInitialBranch(e.target.value)}
                          className={inputClass}>
                          <option value="">Select branch</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Quantity</label>
                        <input type="number" min="0" value={initialQuantity}
                          onChange={e => setInitialQuantity(e.target.value ? parseInt(e.target.value) : '')}
                          className={inputClass} placeholder="0" />
                      </div>
                      <div>
                        <label className={labelClass}>Min. Quantity</label>
                        <input type="number" min="0" value={initialMinQuantity}
                          onChange={e => setInitialMinQuantity(e.target.value ? parseInt(e.target.value) : '')}
                          className={inputClass} placeholder="0" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Images */}
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <div className={cn(iconBoxClass, "bg-rose-50 border border-rose-200")}>
                      <Image className="w-3 h-3 text-rose-500" />
                    </div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                      Product Images
                      {editing && !editingProduct?.primary_image && (
                        <span className="text-amber-600 ml-1 font-normal normal-case">(at least one required)</span>
                      )}
                    </h5>
                  </div>
                  {editing ? (
                    <>
                      {editingProduct?.images.length === 0 && (
                        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-700">No images yet. Upload at least one image for store display.</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {editingProduct?.images.map(img => (
                          <div key={img.id} className="relative group">
                            <img src={img.image} alt={img.alt_text || 'Product image'}
                              className="w-20 h-20 rounded-lg object-cover border border-brand-border" />
                            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button onClick={() => handleImageDelete(img.id)}
                                className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {!img.is_primary && (
                                <button onClick={() => handleSetPrimary(img.id)}
                                  className="p-1.5 bg-brand-blue rounded-full text-white hover:bg-brand-blue-dark transition-colors" title="Set as primary">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {img.is_primary && (
                              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-brand-blue text-white text-[9px] font-bold rounded-md shadow-xs">PRIMARY</span>
                            )}
                          </div>
                        ))}
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-brand-border bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue/50 hover:bg-brand-blue/5 transition-all">
                          {uploadingImage ? (
                            <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-5 h-5 text-brand-muted" />
                              <span className="text-[9px] text-brand-muted mt-0.5">Upload</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file && editing) handleImageUpload(editing, file);
                              e.target.value = '';
                            }} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-xs text-slate-600">Save the product first to enable image upload.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="px-6 py-3">
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {formError}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-4 border-t border-brand-border/50 bg-slate-50/50 flex items-center justify-end gap-2.5">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={() => handleSave()}
                  disabled={saving || !form.name.trim() || !form.category}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-colors shadow-sm shadow-brand-blue/15 flex items-center gap-2 min-w-[130px] justify-center">
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
