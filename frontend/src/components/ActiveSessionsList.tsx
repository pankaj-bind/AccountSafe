// src/components/ActiveSessionsList.tsx

import React, { useState, useEffect } from 'react';
import { getActiveSessions, revokeSession, revokeAllSessions, UserSession } from '../services/sessionService';

// Device Icons
const DesktopIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>
);

const MobileIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
  </svg>
);

const TabletIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

interface ActiveSessionsListProps {
  onSessionRevoked?: () => void;
}

const ActiveSessionsList: React.FC<ActiveSessionsListProps> = ({ onSessionRevoked }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getActiveSessions();
      setSessions(data);
    } catch (err: unknown) {
      console.error('Failed to fetch sessions:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: number) => {
    try {
      setRevokingId(sessionId);
      setError(null);
      await revokeSession(sessionId);
      
      // Optimistically remove the session from the list
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccessMessage('Session revoked successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onSessionRevoked) {
        onSessionRevoked();
      }
    } catch (err: unknown) {
      console.error('Failed to revoke session:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    const otherSessions = sessions.filter(s => !s.is_current);
    if (otherSessions.length === 0) return;

    try {
      setIsRevokingAll(true);
      setError(null);
      const result = await revokeAllSessions();
      
      // Keep only the current session
      setSessions(prev => prev.filter(s => s.is_current));
      setSuccessMessage(result.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onSessionRevoked) {
        onSessionRevoked();
      }
    } catch (err: unknown) {
      console.error('Failed to revoke all sessions:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to revoke sessions');
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <MobileIcon />;
      case 'tablet':
        return <TabletIcon />;
      default:
        return <DesktopIcon />;
    }
  };

  const getDeviceColor = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20';
      case 'tablet':
        return 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="as-card p-6">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center text-green-500">
            <DesktopIcon />
          </span>
          Active Sessions
        </h3>
        <LoadingSpinner />
      </div>
    );
  }

  const otherSessionsCount = sessions.filter(s => !s.is_current).length;

  return (
    <div className="as-card p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center text-green-500">
            <DesktopIcon />
          </span>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Active Sessions
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {sessions.length} device{sessions.length !== 1 ? 's' : ''} logged in
            </p>
          </div>
        </div>
        
        {otherSessionsCount > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={isRevokingAll}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {isRevokingAll ? 'Revoking...' : `Log out all (${otherSessionsCount})`}
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="as-alert-danger mb-4 flex items-center gap-3">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="as-alert-success mb-4 flex items-center gap-3">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            No active sessions found
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                session.is_current
                  ? 'border-green-200 dark:border-green-500/30 bg-green-50/50 dark:bg-green-500/5'
                  : 'border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Device Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getDeviceColor(session.device_type)}`}>
                  {getDeviceIcon(session.device_type)}
                </div>

                {/* Session Details */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {session.browser || 'Unknown Browser'}
                    </span>
                    {session.is_current && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                        Current Device
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>{session.os || 'Unknown OS'}</span>
                    {session.location && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        <span>{session.location}</span>
                      </>
                    )}
                    <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                    <span>{session.last_active_display || 'Unknown'}</span>
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    IP: {session.ip_address}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {!session.is_current && (
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={revokingId === session.id}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {revokingId === session.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Revoking...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden sm:inline">Log Out</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700/50">
        <button
          onClick={fetchSessions}
          disabled={isLoading}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh sessions
        </button>
      </div>
    </div>
  );
};

export default ActiveSessionsList;
