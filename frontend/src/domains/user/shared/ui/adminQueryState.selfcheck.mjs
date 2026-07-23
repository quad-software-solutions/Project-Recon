/**
 * Self-check for non-trivial admin dashboard helpers.
 * Run: node frontend/src/domains/user/shared/ui/adminQueryState.selfcheck.mjs
 */

function filterBulkActivateTargets(users, selectedIds) {
  const selected = new Set(selectedIds);
  return users.filter((u) => selected.has(u.id) && (u.status === 'Pending' || u.status === 'Suspended'));
}

function countUsersByRole(users, resolve) {
  const roles = {};
  users.forEach((u) => {
    const role = resolve(u.assignments || []);
    roles[role] = (roles[role] || 0) + 1;
  });
  return roles;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const users = [
  { id: '1', status: 'Pending' },
  { id: '2', status: 'Active' },
  { id: '3', status: 'Suspended' },
  { id: '4', status: 'Pending' },
];

const activated = filterBulkActivateTargets(users, ['1', '2', '3']);
assert(activated.length === 2, `expected 2 activate targets, got ${activated.length}`);
assert(activated.every((u) => u.status !== 'Active'), 'must not activate already-active users');

const roleUsers = [
  { assignments: [{ role: 'student', is_active: true, is_primary: true }] },
  { assignments: [{ role: 'instructor', is_active: true, is_primary: true }] },
  { assignments: [{ role: 'student', is_active: true, is_primary: true }] },
];
const resolve = (assignments) => {
  const map = { student: 'Student', instructor: 'Instructor' };
  const primary = assignments.find((a) => a.is_primary && a.is_active);
  return map[primary?.role] || 'Student';
};
const counts = countUsersByRole(roleUsers, resolve);
assert(counts.Student === 2, `expected 2 students, got ${counts.Student}`);
assert(counts.Instructor === 1, `expected 1 instructor, got ${counts.Instructor}`);

console.log('adminQueryState.selfcheck: ok');
