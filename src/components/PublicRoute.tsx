import { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  // Removed all redirection logic - now allows all access
  return <>{children}</>;
};

export default PublicRoute; 