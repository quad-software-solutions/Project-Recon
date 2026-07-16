import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit2, Power, Search, X, LayoutGrid, Package,
  Eye, EyeOff,
} from 'lucide-react';
import { storeAdminApi, type CategoryPayload } from '../api/storeAdminApi';
import type { ProductCategory } from '@/domains/store/model/types';
import { cn } from '@/shared/utils/cn';

interface Props {
  addToast: (message: string, type: 'success' | 'error') => void;
}

const emptyForm = (): CategoryPayload => ({
  name: '',
  description: '',
  is_active: true,
});

export default function CategoryManager({ addToast }: Props) {
  const [items, setItems] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await storeAdminApi.categories.list();
      setItems(data);
    } catch (e: any) {
      addToast(e.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (item: ProductCategory) => {
    setForm({ name: item.name, description: item.description, is_active: item.is_active });
    setEditing(item.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await storeAdminApi.categories.update(editing, form);
        addToast('Category updated successfully', 'success');
      } else {
        await storeAdminApi.categories.create(form);
        addToast('Category created successfully', 'success');
      }
      setShowModal(false);
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ProductCategory) => {
    try {
      if (item.is_active) {
        await storeAdminApi.categories.deactivate(item.id);
        addToast('Category deactivated', 'success');
      } else {
        await storeAdminApi.categories.activate(item.id);
        addToast('Category activated', 'success');
      }
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to toggle category', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await storeAdminApi.categories.delete(id);
      addToast('Category deleted', 'success');
      setDeleteConfirm(null);
      fetchItems();
    } catch (e: any) {
      addToast(e.message || 'Failed to delete category', 'error');
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = items.filter(i => i.is_active).length;
  const totalProducts = items.reduce((sum, c) => sum + c.product_count, 0);

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-ink">Categories</h3>
            <p className="text-xs text-brand-muted">
              {activeCount} active &middot; {totalProducts} total products
            </p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-dark transition-colors shadow-sm shadow-brand-blue/15">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-brand-border/30 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue placeholder:text-brand-muted/60"
          />
        </div>
      </div>

      {/* Category List */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-brand-muted">{search ? 'No matching categories' : 'No categories yet'}</p>
            {!search && (
              <button onClick={openCreate} className="mt-3 text-sm font-medium text-brand-blue hover:text-brand-blue-dark">
                Create your first category
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <AnimatePresence>
              {filtered.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-150",
                    item.is_active
                      ? "bg-white border-brand-border hover:border-brand-blue/20 hover:shadow-sm hover:-translate-y-0.5"
                      : "bg-slate-50/50 border-slate-200/60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5",
                        item.is_active
                          ? "bg-violet-50 border-violet-200"
                          : "bg-slate-100 border-slate-200"
                      )}>
                        <LayoutGrid className={cn(
                          "w-4 h-4",
                          item.is_active ? "text-violet-600" : "text-slate-400"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "text-sm font-semibold truncate",
                            item.is_active ? "text-brand-ink" : "text-slate-400"
                          )}>
                            {item.name}
                          </h4>
                          {!item.is_active && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Inactive</span>
                          )}
                        </div>
                        {item.description && (
                          <p className={cn(
                            "text-xs mt-0.5 truncate",
                            item.is_active ? "text-brand-muted" : "text-slate-300"
                          )}>
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Package className="w-3 h-3 text-brand-muted" />
                          <span className="text-xs text-brand-muted">{item.product_count} product{item.product_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-blue-50 transition-all"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={cn(
                          "p-1.5 rounded-lg transition-all",
                          item.is_active
                            ? "text-brand-muted hover:text-orange-600 hover:bg-orange-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        )}
                        title={item.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {item.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item.id)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete category"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border p-6 w-full max-w-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <h4 className="text-base font-bold text-brand-ink text-center mb-1">Delete Category?</h4>
              <p className="text-sm text-brand-muted text-center mb-6">This will permanently remove this category and may affect products assigned to it.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-brand-muted bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-md mx-auto"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-violet-600" />
                  </div>
                  <h4 className="text-sm font-bold text-brand-ink">{editing ? 'Edit Category' : 'New Category'}</h4>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-brand-muted hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                    placeholder="e.g. Microcontrollers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue resize-none"
                    placeholder="Brief description of this category"
                  />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer p-3 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="rounded border-brand-border text-brand-blue focus:ring-brand-blue/20"
                  />
                  <div>
                    <span className="text-sm font-medium text-brand-ink">Active</span>
                    <p className="text-xs text-brand-muted">Inactive categories are hidden from the storefront</p>
                  </div>
                </label>
              </div>

              <div className="px-6 py-4 border-t border-brand-border/50 bg-slate-50/50 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-colors shadow-sm shadow-brand-blue/15 flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editing ? (
                    'Update Category'
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
