import { useAppContext } from '@/context';

/**
 * Rolegard Component - Role-based conditional rendering
 * Similar to the Inertia.js version
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show if authorized
 * @param {string[]} props.authorized - Roles that are allowed to see content
 * @param {string[]} props.except - Roles that are NOT allowed to see content
 */
export default function Rolegard({ children, authorized = [], except = [] }) {
  const { user } = useAppContext();

  // Get user roles - handle both array and single role
  const userRoles = Array.isArray(user?.roles) 
    ? user.roles.map(r => typeof r === 'string' ? r.toLowerCase() : r)
    : user?.roles 
      ? [typeof user.roles === 'string' ? user.roles.toLowerCase() : user.roles]
      : [];

  // Ensure authorized and except are arrays
  const allowedRoles = Array.isArray(authorized) 
    ? authorized.map(r => r?.toLowerCase()) 
    : [authorized?.toLowerCase()];
  const excludedRoles = Array.isArray(except) 
    ? except.map(r => r?.toLowerCase()) 
    : [except?.toLowerCase()];

  // Check if user has any authorized role
  const hasAuthorizedRole = allowedRoles.length === 0
    ? true
    : userRoles.some(role => allowedRoles.includes(role?.toLowerCase?.() || role));

  // Check if user has any excluded role
  const hasExcludedRole = userRoles.some(role => excludedRoles.includes(role?.toLowerCase?.() || role));

  // Authorization logic:
  // - If user has authorized role → show
  // - If no authorized specified (empty) → show everyone except excluded
  // - If user has both authorized and excluded → authorized wins
  const isAuthorized =
    (hasAuthorizedRole && !(!allowedRoles.length && hasExcludedRole)) ||
    (allowedRoles.length === 0 && !hasExcludedRole);

  return <>{isAuthorized ? children : null}</>;
}

