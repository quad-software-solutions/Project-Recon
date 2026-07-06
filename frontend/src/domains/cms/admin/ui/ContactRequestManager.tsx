import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone, Trash2, Check, Clock, X, Eye, ChevronDown } from 'lucide-react';
import { api, ContactRequest } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const STATUS_ICONS: Record<string, React.ElementType> = { pending: Clock, resolved: Check, archived: X };

export default function ContactRequestManager({ addToast }: Props) {
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'archived'>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<ContactRequest>('contact-requests')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: 'pending' | 'resolved' | 'archived') => {
    try {
      await api.update('contact-requests', id, { status });
      addToast(`Marked as ${status}`, 'success');
      setSelected(null);
      load();
    } catch { addToast('Update failed', 'error'); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this contact request?')) return;
    try { await api.delete('contact-requests', id); addToast('Deleted', 'success'); setSelected(null); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Contact Requests</h2>
          <div className="flex gap-1">
            {(['all', 'pending', 'resolved', 'archived'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filter === s ? 'bg-brand-red text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No requests found</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.map(item => {
              const StatusIcon = STATUS_ICONS[item.status] || Clock;
              return (
                <div key={item.id} onClick={() => setSelected(item)}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    item.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                    item.status === 'resolved' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        item.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>{item.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.subject}</p>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.message}</p>
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:col-span-1 self-start sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Details</h3>
            <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Name</span>
              <p className="text-slate-800 font-medium">{selected.name}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Email</span>
              <a href={`mailto:${selected.email}`} className="text-blue-600 font-medium flex items-center gap-1 hover:underline">
                <Mail className="w-3 h-3" /> {selected.email}
              </a>
            </div>
            {selected.phone && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Phone</span>
                <a href={`tel:${selected.phone}`} className="text-slate-800 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {selected.phone}
                </a>
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Subject</span>
              <p className="text-slate-800 font-medium">{selected.subject}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Message</span>
              <p className="text-slate-600 whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Received</span>
              <p className="text-slate-500">{new Date(selected.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
            {selected.status !== 'resolved' && (
              <button onClick={() => updateStatus(selected.id, 'resolved')}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600">
                <Check className="w-4 h-4" /> Mark Resolved
              </button>
            )}
            {selected.status !== 'pending' && (
              <button onClick={() => updateStatus(selected.id, 'pending')}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200">
                <Clock className="w-4 h-4" /> Reopen
              </button>
            )}
            <button onClick={() => remove(selected.id)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 border border-red-200">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
