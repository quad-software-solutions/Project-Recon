import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Calendar, Clock, CheckCircle2, Users, UserCheck, UserX, Send, Eye, Edit3, Trash2, Building } from 'lucide-react';
import { fetchAvailableStaffApi, fetchStaffAttendanceSessionsApi, createStaffAttendanceSessionApi, updateStaffAttendanceSessionApi, publishStaffAttendanceSessionApi, upsertStaffAttendanceRecordsApi } from '@/src/domains/learning/academics/api/academicApi';
import { branchesApi } from '@/src/domains/user/shared/api/adminApi';

const defaultForm = { branch: '', date: '', notes: '' };

export default function StaffAttendanceManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showRecords, setShowRecords] = useState<any | null>(null);
  const [recordForm, setRecordForm] = useState<Record<string, string>>({});
  const [recordSaving, setRecordSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchStaffAttendanceSessionsApi(),
      branchesApi.list().catch(() => []),
    ]).then(([s, b]) => {
      setSessions(Array.isArray(s) ? s : []);
      const branchList = Array.isArray(b) ? b : (b as any)?.results || [];
      setBranches(branchList);
    }).catch(() => setError('Failed to load staff attendance')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingSession(null);
    setForm(defaultForm);
    setShowCreate(true);
  };

  const openEdit = (s: any) => {
    setEditingSession(s);
    setForm({ branch: s.branch || '', date: s.date?.slice(0, 10) || '', notes: s.notes || '' });
    setShowCreate(true);
  };

  const handleSaveSession = async () => {
    if (!form.date) return;
    setSaving(true);
    setError(null);
    try {
      if (editingSession) {
        await updateStaffAttendanceSessionApi(editingSession.id, form);
      } else {
        await createStaffAttendanceSessionApi(form);
      }
      setShowCreate(false);
      setEditingSession(null);
      setForm(defaultForm);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishStaffAttendanceSessionApi(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish session');
    }
  };

  const openRecords = async (session: any) => {
    setShowRecords(session);
    const existing: Record<string, string> = {};
    if (session.records) {
      session.records.forEach((r: any) => { existing[r.staff_member || r.user] = r.status; });
    }
    setRecordForm(existing);
    setAvailableStaff([]);
    if (session.branch) {
      try {
        const staff = await fetchAvailableStaffApi({ branch: session.branch });
        setAvailableStaff(Array.isArray(staff) ? staff : []);
      } catch {
        setAvailableStaff([]);
      }
    }
  };

  const handleSaveRecords = async () => {
    if (!showRecords) return;
    setRecordSaving(true);
    setError(null);
    try {
      const records = Object.entries(recordForm).map(([user, status]) => ({ staff_member: user, status: status as string }));
      await upsertStaffAttendanceRecordsApi(showRecords.id, records);
      setShowRecords(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save records');
    } finally {
      setRecordSaving(false);
    }
  };

  const filtered = sessions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.date?.includes(q) || (s.notes || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Staff Attendance</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-red-dark transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Session
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: Calendar, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Published', value: sessions.filter(s => s.status === 'PUBLISHED').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Staff Available', value: availableStaff.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-xl px-4 py-3">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="font-black text-lg text-slate-900">{s.value}</p>
            <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sessions..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-red" />
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Notes</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Records</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No sessions matching' : 'No staff attendance sessions yet'}
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-slate-600" /></div>
                      <span className="text-xs font-semibold text-slate-900">{s.date?.slice(0, 10) || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell max-w-[200px] truncate">{s.notes || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.status || 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">{s.record_count || s.records?.length || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openRecords(s)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Manage Records"><Users className="w-3.5 h-3.5" /></button>
                      {s.status !== 'PUBLISHED' && (
                        <>
                          <button onClick={() => openEdit(s)} className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handlePublish(s.id)} className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50" title="Publish"><Send className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <h3 className="font-bold text-base text-slate-900">{editingSession ? 'Edit Session' : 'New Attendance Session'}</h3>
                  <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Branch</label>
                    <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select branch...</option>
                      {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSaveSession} disabled={saving || !form.branch || !form.date}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? 'Saving...' : editingSession ? 'Update' : 'Create Session'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {showRecords && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRecords(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Users className="w-4 h-4 text-slate-600" /></div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Staff Attendance</h3>
                      <p className="text-[10px] text-slate-500">{showRecords.date?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRecords(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                  {availableStaff.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No staff members available</p>
                  ) : availableStaff.map((staff: any) => (
                    <div key={staff.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {(staff.full_name || staff.email || '?').charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-slate-700">{staff.full_name || staff.email}</span>
                      </div>
                      <select
                        value={recordForm[staff.id] || 'PRESENT'}
                        onChange={e => setRecordForm(p => ({ ...p, [staff.id]: e.target.value }))}
                        className="px-2 py-1 bg-white border border-brand-border rounded-lg text-[10px] font-bold focus:outline-none focus:border-brand-red"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setShowRecords(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSaveRecords} disabled={recordSaving}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-1.5">
                    {recordSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {recordSaving ? 'Saving...' : 'Save Records'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
