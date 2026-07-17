import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Mail, Phone, Trash2, Check, Clock, X, Search, GraduationCap, ArrowRight, Inbox, CheckCircle2 } from 'lucide-react';
import { api, ContactRequest } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const STATUS_ICONS: Record<string, React.ElementType> = { pending: Clock, 'in-progress': Clock, resolved: Check, archived: X };
const STATUS_LABELS: Record<string, string> = { pending: 'New', 'in-progress': 'In Progress', resolved: 'Processed', archived: 'Archived' };
const STATUS_TONES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  'in-progress': 'bg-blue-50 text-blue-700 border-blue-100',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

function isStudentRegistration(item: ContactRequest): boolean {
  return item.subject?.toLowerCase().startsWith('student registration request') || item.message?.toLowerCase().includes('selected courses:');
}

function registrationStudentName(item: ContactRequest): string {
  const source = item.message || '';
  const match = source.match(/^Student:\s*(.+)$/im);
  return match?.[1]?.trim() || item.subject?.replace(/^Student registration request:\s*/i, '').trim() || item.name;
}

export default function ContactRequestManager({ addToast }: Props) {
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'registration' | 'general'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<ContactRequest>('contact-requests')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'pending' | 'resolved' | 'archived') => {
    try {
      await api.update('contact-requests', id, { status });
      addToast(`Marked as ${STATUS_LABELS[status].toLowerCase()}`, 'success');
      setSelected(null);
      load();
    } catch { addToast('Update failed', 'error'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this contact request?')) return;
    try { await api.delete('contact-requests', id); addToast('Deleted', 'success'); setSelected(null); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const filtered = useMemo(() => {
    let result = filter === 'all' ? items : items.filter(i => i.status === filter);
    if (typeFilter === 'registration') result = result.filter(isStudentRegistration);
    if (typeFilter === 'general') result = result.filter(i => !isStudentRegistration(i));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.subject?.toLowerCase().includes(q) ||
        i.message?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, filter, typeFilter, search]);

  const stats = useMemo(() => {
    const registrations = items.filter(isStudentRegistration);
    return {
      total: items.length,
      registrations: registrations.length,
      pendingRegistrations: registrations.filter(i => i.status === 'pending').length,
      processedRegistrations: registrations.filter(i => i.status === 'resolved').length,
    };
  }, [items]);

  const selectedIsRegistration = selected ? isStudentRegistration(selected) : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-slate-800">Contact Requests</h2>
              <p className="text-xs text-slate-500">Review public messages and student registration requests.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-7 pr-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 w-44" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'All Requests', value: stats.total, icon: Inbox, tone: 'bg-slate-50 text-slate-600' },
              { label: 'Registrations', value: stats.registrations, icon: GraduationCap, tone: 'bg-blue-50 text-blue-600' },
              { label: 'New Registrations', value: stats.pendingRegistrations, icon: Clock, tone: 'bg-amber-50 text-amber-600' },
              { label: 'Processed', value: stats.processedRegistrations, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                  <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-lg ${stat.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-black leading-none text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {([
                ['all', 'All'],
                ['registration', 'Registrations'],
                ['general', 'General'],
              ] as const).map(([value, label]) => (
                <button key={value} onClick={() => setTypeFilter(value)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    typeFilter === value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {([
                ['all', 'Any status'],
                ['pending', 'New'],
                ['resolved', 'Processed'],
                ['archived', 'Archived'],
              ] as const).map(([s, label]) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    filter === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            {items.length === 0 ? 'No requests found' : 'No requests match your search'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.map(item => {
              const StatusIcon = STATUS_ICONS[item.status] || Clock;
              const registrationRequest = isStudentRegistration(item);
              const statusLabel = STATUS_LABELS[item.status] || item.status;
              const createdAt = item.createdAt || item.created_at;
              return (
                <div key={item.id} onClick={() => setSelected(item)}
                  className={`flex items-start gap-3 p-3 transition-colors cursor-pointer ${
                    selected?.id === item.id ? 'bg-blue-600/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    item.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                    item.status === 'resolved' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-800">{registrationRequest ? registrationStudentName(item) : item.name}</p>
                      {registrationRequest && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          <GraduationCap className="w-3 h-3" /> Registration
                        </span>
                      )}
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONES[item.status] || STATUS_TONES.archived}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.subject}</p>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.message}</p>
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">{createdAt ? new Date(createdAt).toLocaleDateString() : '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-1 self-start sticky top-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-bold text-slate-800">Registration Workflow</h3>
          <div className="mt-3 space-y-2 text-xs text-slate-700">
            {[
              'New public registration appears here as New.',
              'Review student, guardian, course, branch, and payment details.',
              'Create the student in Academic Admissions.',
              'Enroll the student and record or verify payment.',
              'Mark this request Processed after the account/enrollment is done.',
            ].map((step, index) => (
              <div key={step} className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-black text-blue-600">{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>

      {selected ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:col-span-1 self-start sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Details</h3>
            <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            {selectedIsRegistration && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <GraduationCap className="w-4 h-4" />
                  <p className="text-xs font-black uppercase tracking-wide">Student Registration Request</p>
                </div>
                <p className="mt-1 text-sm font-bold text-slate-900">{registrationStudentName(selected)}</p>
                <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                  <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Super Admin reviews this request here.</p>
                  <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Admin, Manager, or Secretary creates the student in Academic Admissions.</p>
                  <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Then enroll the student and record/verify payment.</p>
                  <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Mark this request resolved only after the account/enrollment is processed.</p>
                </div>
              </div>
            )}
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
              <p className="text-slate-500">{selected.createdAt || selected.created_at ? new Date(selected.createdAt || selected.created_at).toLocaleString() : '—'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
            {selected.status !== 'resolved' && (
              <button onClick={() => updateStatus(selected.id, 'resolved')}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600">
                <Check className="w-4 h-4" /> {selectedIsRegistration ? 'Mark Processed' : 'Mark Resolved'}
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-200 p-6 text-center">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Select a request</p>
          <p className="mt-1 text-xs text-slate-400">Details and actions will appear here.</p>
        </div>
      )}
      </div>
    </div>
  );
}
