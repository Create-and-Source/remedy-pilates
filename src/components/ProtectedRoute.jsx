import { Navigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * In demo mode (no API configured), always allows access.
 * In production mode, checks for a valid auth token.
 *
 * Optional `roles` prop restricts access to specific Cognito groups.
 */
export default function ProtectedRoute({ children, roles }) {
  // Demo mode — skip auth check entirely
  if (!API) return children;

  const token = localStorage.getItem('rp_auth_token');
  const userRole = localStorage.getItem('rp_user_role');

  // No token → redirect to sign in
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // Optional role check
  if (roles && roles.length > 0 && !roles.includes(userRole)) {
    // User is authenticated but wrong role — send to portal or admin based on role
    return <Navigate to={userRole === 'client' ? '/portal' : '/admin'} replace />;
  }

  return children;
}
