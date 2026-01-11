import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { token } = useAuth();

  if (token) {
    // Redirect logged-in users to the homepage instead of the dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
