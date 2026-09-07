/**
 * Normalize API / stub user roles for consistent UI gates.
 * Prefer `roles` array; fall back to single `role` string/array.
 */
export function getUserRoles(user) {
  if (!user || typeof user !== 'object') return [];

  const source = user.roles ?? user.role;
  if (source == null || source === '') return [];

  const list = Array.isArray(source) ? source : [source];
  return [
    ...new Set(
      list
        .map((entry) => {
          if (typeof entry === 'string') return entry.trim().toLowerCase();
          if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
            return entry.name.trim().toLowerCase();
          }
          return null;
        })
        .filter(Boolean),
    ),
  ];
}

export function userHasAnyRole(user, roles = []) {
  const normalized = getUserRoles(user);
  const wanted = (Array.isArray(roles) ? roles : [roles])
    .map((r) => String(r || '').toLowerCase())
    .filter(Boolean);
  return wanted.some((role) => normalized.includes(role));
}

export function userHasAdminRole(user) {
  return getUserRoles(user).includes('admin');
}
