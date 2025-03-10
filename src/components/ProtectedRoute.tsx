import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Removed all protection logic - now allows all access
  return <>{children}</>;
};

export default ProtectedRoute; 