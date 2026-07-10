function RolesPermissions() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [showPerms, setShowPerms] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editAssign, setEditAssign] = useState<AssignmentResponse | null>(null);
  const [assignForm, setAssignForm] = useState({ user_id: '', branch_id: '', role: 'instructor', is_primary: false });
  const [userSearch, setUserSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, branchArr, assignArr] = await Promise.all([
        fetchUsersApi(),
        branchesApi.list().catch(() => [] as BranchResponse[]),
        assignmentsApi.list().catch(() => [] as AssignmentResponse[]),
      ]);
      setUsers(userRes.results ?? []);
      setBranches(branchArr);
      setAssignments(assignArr);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load role data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const roleDefs = [
    { key: 'super_admin', label: 'Admin', plural: 'Admins', weight: 'high', icon: Shield, desc: 'Full system access. Manage users, branches, settings, and all platform resources.' },
    { key: 'branch_manager', label: 'Manager', plural: 'Managers', weight: 'high', icon: Building, desc: 'Manage branch operations, users, registrations, and local content.' },
    { key: 'secretary', label: 'Secretary', plural: 'Secretaries', weight: 'mid', icon: ClipboardList, desc: 'Handle admissions, enrollments, payments, certificates, and daily operations.' },
    { key: 'instructor', label: 'Instructor', plural: 'Instructors', weight: 'mid', icon: GraduationCap, desc: 'Create and manage courses, grade students, moderate forum content.' },
    { key: 'student', label: 'Student', plural: 'Students', weight: 'low', icon: Users, desc: 'Access courses, participate in forums, shop in store, view certificates.' },
  ] as const;

  const getUsersByRole = (roleKey: string) =>
    users.filter(u => u.assignments?.some(a => a.role === roleKey && a.is_active !== false));

  const getAssignmentsByRole = (roleKey: string) =>
    assignments.filter(a => a.role === roleKey && a.is_active !== false);

  const unassignedUsers = users.filter(u =>
    !u.assignments?.some(a => a.is_active !== false)
  );

  const userOptions = users.filter(u =>
    !u.assignments?.some(a => a.role === assignForm.role && a.is_active !== false)
  );

  const filteredUserOptions = userSearch
    ? userOptions.filter(u =>
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : userOptions;

  const handleAssignRole = async () => {
    try {
      await assignmentsApi.create({
        user_id: assignForm.user_id,
        branch_id: assignForm.branch_id || null,
        role: assignForm.role,
        is_primary: assignForm.is_primary,
      });
      setShowAssignModal(false);
      setAssignForm({ user_id: '', branch_id: '', role: 'instructor', is_primary: false });
      setUserSearch('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign role');
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editAssign) return;
    try {
      await assignmentsApi.update(editAssign.id, {
        is_primary: editAssign.is_primary,
        is_active: editAssign.is_active,
      });
      setEditAssign(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update assignment');
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    try {
      await assignmentsApi.delete(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove assignment');
    }
  };

  const roleMap = Object.fromEntries(roleDefs.map(r => [r.key, r]));

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  // Calculate stats for signature element
  const total = users.length || 1; // prevent div by zero
  const weightColors = { high: 'bg-slate-900', mid: 'bg-slate-400', low: 'bg-slate-200' };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Signature Element: Proportional Distribution Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{users.length}</h2>
            <p className="text-sm font-medium text-slate-500">Total System Users</p>
          </div>
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-px">
            <Plus className="w-4 h-4" /> Assign Role
          </button>
        </div>

        {/* The Bar */}
        <div className="flex w-full h-3 rounded-full overflow-hidden mb-4 bg-slate-50 shadow-inner">
          {roleDefs.map(r => {
            const count = getUsersByRole(r.key).length;
            const width = (count / total) * 100;
            if (width === 0) return null;
            return <div key={r.key} style={{ width: `${width}%` }} className={`${weightColors[r.weight]} border-r border-white/20 last:border-r-0 transition-all`} title={`${r.plural}: ${count}`} />
          })}
          {unassignedUsers.length > 0 && (
            <div style={{ width: `${(unassignedUsers.length / total) * 100}%` }} className="bg-red-200 transition-all" title={`Unassigned: ${unassignedUsers.length}`} />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {roleDefs.map(r => {
            const count = getUsersByRole(r.key).length;
            return (
              <div key={r.key} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${weightColors[r.weight]}`} />
                <span className="font-medium text-slate-600">{r.plural}</span>
                <span className="font-bold text-slate-900">{count}</span>
              </div>
            );
          })}
          {unassignedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-200" />
              <span className="font-medium text-slate-600">Unassigned</span>
              <span className="font-bold text-slate-900">{unassignedUsers.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Unassigned Users Callout */}
      {unassignedUsers.length > 0 && (
        <div className="bg-red-50/50 border border-red-200/60 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{unassignedUsers.length} pending user{unassignedUsers.length !== 1 && 's'}</h4>
              <p className="text-xs text-slate-600 mt-0.5">These users have registered but have no role assignment.</p>
            </div>
          </div>
          <button onClick={() => { setAssignForm(p => ({ ...p, role: 'student' })); setShowAssignModal(true); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-50 transition-colors shrink-0">
            Review Unassigned
          </button>
        </div>
      )}

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roleDefs.map(r => {
          const roleUsers = getUsersByRole(r.key);
          const roleAssignments = getAssignmentsByRole(r.key);
          const Icon = r.icon;
          const isExpanded = expandedRole === r.key;
          const permsOpen = showPerms === r.key;
          const permDef = PERMISSIONS[r.key] || { permissions: [] };

          const filteredRoleUsers = roleSearch && isExpanded
            ? roleUsers.filter(u =>
                u.full_name.toLowerCase().includes(roleSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(roleSearch.toLowerCase())
              )
            : roleUsers;

          const branchCounts = [...new Set(roleAssignments.map(a => a.branch?.id).filter(Boolean))].length;

          // Distinct weight styling
          const cardClass = r.weight === 'high'
            ? 'bg-white border-2 border-slate-900 shadow-sm'
            : r.weight === 'mid'
            ? 'bg-white border border-slate-200 shadow-sm'
            : 'bg-slate-50 border border-slate-200 border-dashed';

          const iconClass = r.weight === 'high'
            ? 'bg-slate-900 text-white'
            : r.weight === 'mid'
            ? 'bg-slate-100 text-slate-700'
            : 'bg-transparent text-slate-400 border border-slate-200';

          return (
            <div key={r.key} className={`rounded-xl overflow-hidden transition-all duration-200 ${cardClass} flex flex-col`}>
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 tracking-tight">{r.label}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                        <span>{roleUsers.length} user{roleUsers.length !== 1 && 's'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{branchCounts} branch{branchCounts !== 1 && 'es'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Empty state explicit indicator if high/mid weight */}
                  {roleUsers.length === 0 && r.weight !== 'low' && (
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase tracking-wider rounded-md">Empty</span>
                  )}
                </div>

                <p className="text-sm text-slate-600 mb-5 leading-relaxed">{r.desc}</p>

                {roleUsers.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-lg border border-slate-100 mt-auto">
                    <p className="text-sm font-semibold text-slate-700">No {r.plural.toLowerCase()} assigned</p>
                    <p className="text-xs text-slate-500 mb-3 mt-1">Assign users to this role to grant them access.</p>
                    <button
                      onClick={() => { setAssignForm(p => ({ ...p, role: r.key })); setShowAssignModal(true); }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Assign {r.label}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* User Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roleAssignments.slice(0, 4).map(a => {
                        const nameParts = (a.user?.full_name || '').split(' ');
                        const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0]?.[0] || '?';
                        return (
                          <div key={a.id} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md p-1.5 pr-2.5 transition-colors cursor-pointer" onClick={() => setEditAssign(a)}>
                            <div className="w-6 h-6 rounded bg-slate-200 text-[9px] font-bold flex items-center justify-center text-slate-600 shrink-0 uppercase">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-semibold text-slate-900 leading-tight truncate">{a.user?.full_name?.split(' ')[0]}</span>
                              <span className="text-[9px] text-slate-500 leading-tight truncate">{a.branch?.name?.slice(0, 15) || 'Global'}</span>
                            </div>
                          </div>
                        );
                      })}
                      {roleAssignments.length > 4 && (
                        <div className="flex items-center justify-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-500">
                          +{roleAssignments.length - 4}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { setExpandedRole(isExpanded ? null : r.key); setRoleSearch(''); }}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'Manage'} Users
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={() => setShowPerms(permsOpen ? null : r.key)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {permsOpen ? 'Hide' : 'View'} Policies
                      </button>
                    </div>
                  </>
                )}

                {/* Policies Drawer */}
                <AnimatePresence>
                  {permsOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Granted Permissions</p>
                        {permDef.permissions.map(p => (
                          <div key={p} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Expanded User List */}
              <AnimatePresence>
                {isExpanded && roleUsers.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-200 bg-slate-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-200">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          value={roleSearch}
                          onChange={e => setRoleSearch(e.target.value)}
                          placeholder={`Search ${r.plural.toLowerCase()}...`}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-shadow"
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
                      {filteredRoleUsers.length === 0 ? (
                        <p className="p-4 text-xs text-center text-slate-500 font-medium">No matches found.</p>
                      ) : filteredRoleUsers.map(u => {
                        const userAssignments = assignments.filter(a => a.role === r.key && a.user?.id === u.id && a.is_active !== false);
                        const nameParts = u.full_name.split(' ');
                        const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0]?.[0] || '?';
                        return (
                          <div key={u.id} className="p-3 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 uppercase">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{u.full_name}</p>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</p>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {userAssignments.map(a => (
                                    <span key={a.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-semibold text-slate-600">
                                      {a.branch?.name ? <><Building className="w-2.5 h-2.5 text-slate-400" />{a.branch.name}</> : 'Global Access'}
                                      {a.is_primary && <Star className="w-2.5 h-2.5 text-amber-500" />}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0 ml-2">
                              {userAssignments.map(a => (
                                <button
                                  key={a.id}
                                  onClick={() => setEditAssign(a)}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                                >
                                  Edit Access
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Assign Role Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 tracking-tight">Assign Role</h3>
                  <p className="text-xs text-slate-500 mt-1">Grant platform access to a registered user.</p>
                </div>
                <button onClick={() => { setShowAssignModal(false); setUserSearch(''); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Select User</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {filteredUserOptions.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500 text-center font-medium">No available users found.</p>
                    ) : filteredUserOptions.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setAssignForm(p => ({ ...p, user_id: u.id }))}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${assignForm.user_id === u.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 uppercase ${assignForm.user_id === u.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {u.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{u.full_name}</p>
                          <p className={`text-[11px] truncate ${assignForm.user_id === u.id ? 'text-slate-300' : 'text-slate-500'}`}>{u.email}</p>
                        </div>
                        {assignForm.user_id === u.id && <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Role</label>
                      <select value={assignForm.role} onChange={e => setAssignForm(p => ({ ...p, role: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow">
                        {roleDefs.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Branch Restriction</label>
                    <select value={assignForm.branch_id} onChange={e => setAssignForm(p => ({ ...p, branch_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow">
                      <option value="">Global Access (All)</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors mt-2">
                  <input type="checkbox" checked={assignForm.is_primary} onChange={e => setAssignForm(p => ({ ...p, is_primary: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Set as Primary Role</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">This determines the user's default dashboard and badges.</p>
                  </div>
                </label>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => { setShowAssignModal(false); setUserSearch(''); }}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Cancel</button>
                  <button onClick={handleAssignRole} disabled={!assignForm.user_id || !assignForm.role}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm">Confirm Assignment</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Assignment Modal */}
      <AnimatePresence>
        {editAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setEditAssign(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 tracking-tight">Edit Access</h3>
                  <p className="text-xs text-slate-500 mt-1">Modify existing role assignment.</p>
                </div>
                <button onClick={() => setEditAssign(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">User</span>
                    <span className="font-bold text-slate-900">{editAssign.user?.full_name || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Role</span>
                    <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-200 rounded-md text-xs">{roleMap[editAssign.role]?.label || editAssign.role}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Scope</span>
                    <span className="font-bold text-slate-900">{editAssign.branch?.name || 'Global Access'}</span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={editAssign.is_primary}
                      onChange={e => setEditAssign(p => p ? { ...p, is_primary: e.target.checked } : p)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Primary Role <Star className="inline w-3.5 h-3.5 text-amber-500 mb-0.5" /></p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={editAssign.is_active}
                      onChange={e => setEditAssign(p => p ? { ...p, is_active: e.target.checked } : p)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Active Status</p>
                    </div>
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-slate-100 items-center">
                  <button onClick={() => handleRemoveAssignment(editAssign.id)}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5 transition-colors shadow-sm">
                    <Trash2 className="w-4 h-4" /> Revoke
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => setEditAssign(null)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Cancel</button>
                  <button onClick={handleUpdateAssignment}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">Save Changes</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
