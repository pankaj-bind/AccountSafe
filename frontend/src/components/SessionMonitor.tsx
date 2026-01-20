// components/SessionMonitor.tsx
import { useSessionMonitor } from '../hooks/useSessionMonitor';
import { useAuth } from '../contexts/AuthContext';

/**
 * SessionMonitor component that polls the backend to check if session is still valid.
 * Automatically logs out if session is revoked from another device.
 */
const SessionMonitor: React.FC = () => {
  const { token } = useAuth();

  useSessionMonitor({
    enabled: !!token, // Monitor only when user is authenticated
    intervalMs: 2000, // Check every 2 seconds for instant logout
  });

  // This component doesn't render anything
  return null;
};

export default SessionMonitor;
