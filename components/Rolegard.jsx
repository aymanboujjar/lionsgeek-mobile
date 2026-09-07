import { useAppContext } from '@/context';
import { getUserRoles } from '@/utils/roles';

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
  const userRoles = getUserRoles(user);

  const allowedRoles = Array.isArray(authorized)
    ? authorized.map((r) => r?.toLowerCase())
    : [authorized?.toLowerCase()];
  const excludedRoles = Array.isArray(except)
    ? except.map((r) => r?.toLowerCase())
    : [except?.toLowerCase()];

  const hasAuthorizedRole =
    allowedRoles.length === 0
      ? true
      : userRoles.some((role) => allowedRoles.includes(role));

  const hasExcludedRole = userRoles.some((role) => excludedRoles.includes(role));

  const isAuthorized =
    (hasAuthorizedRole && !(!allowedRoles.length && hasExcludedRole)) ||
    (allowedRoles.length === 0 && !hasExcludedRole);

  return <>{isAuthorized ? children : null}</>;
}
