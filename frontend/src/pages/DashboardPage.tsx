import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import apiClient from '../api/apiClient';

interface DashboardStats {
  organization_count: number;
  profile_count: number;
  recent_logins: LoginRecord[];
}

interface LoginRecord {
  id: number;
  username_attempted: string;
  password_attempted: string | null;
  status: 'success' | 'failed';
  ip_address: string;
  country: string;
  isp: string;
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  location: string | null;
  user_agent: string;
  timestamp: string;
}

const DashboardPage: React.FC = () => {
  const { displayName } = useProfile();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [allRecords, setAllRecords] = useState<LoginRecord[]>([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get('/dashboard/statistics/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLoginRecords = async () => {
    try {
      const response = await apiClient.get('/login-records/?limit=50');
      setAllRecords(response.data.records);
      setShowAllRecords(true);
    } catch (error) {
      console.error('Failed to fetch login records:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-win-bg-solid flex items-center justify-center">
        <div className="text-win-text-secondary">Loading...</div>
      </div>
    );
  }

  const displayRecords = showAllRecords ? allRecords : (stats?.recent_logins || []);

  return (
    <div className="min-h-screen bg-win-bg-solid">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-win-text-primary mb-2">Dashboard</h1>
          <p className="text-win-text-secondary">Welcome back, {displayName}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Organizations */}
          <div className="win-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-win-text-primary mb-1">{stats?.organization_count || 0}</p>
            <p className="text-sm text-win-text-tertiary">Organizations</p>
          </div>

          {/* Profiles */}
          <div className="win-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-win-text-primary mb-1">{stats?.profile_count || 0}</p>
            <p className="text-sm text-win-text-tertiary">Saved Profiles</p>
          </div>

          {/* Login Records */}
          <div className="win-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-win-text-primary mb-1">{stats?.recent_logins.length || 0}</p>
            <p className="text-sm text-win-text-tertiary">Recent Logins</p>
          </div>

          {/* Security */}
          <div className="win-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-win-text-primary mb-1">Secure</p>
            <p className="text-sm text-win-text-tertiary">Encrypted</p>
          </div>
        </div>

        {/* Login Records Table */}
        <div className="win-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-win-text-primary">Login Records</h2>
            {!showAllRecords && stats?.recent_logins && stats.recent_logins.length > 0 && (
              <button
                onClick={fetchAllLoginRecords}
                className="text-sm text-win-accent hover:text-win-accent-light transition-colors"
              >
                View All
              </button>
            )}
          </div>

          {displayRecords.length === 0 ? (
            <p className="text-win-text-tertiary text-center py-8">No login records yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-win-border-subtle">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-win-text-tertiary">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-win-text-tertiary">Date & Time</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-win-text-tertiary">IP Address</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-win-text-tertiary">Coordinates (Lat, Long)</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-win-text-tertiary">Country</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-win-text-tertiary">ISP</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRecords.map((record) => (
                    <tr key={record.id} className="border-b border-win-border-subtle hover:bg-win-bg-subtle transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'success' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {record.status === 'success' ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-win-text-secondary">
                        <div>{record.date}</div>
                        <div className="text-xs text-win-text-tertiary">{record.time}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-win-text-secondary font-mono">{record.ip_address || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-win-text-secondary">
                        {record.latitude && record.longitude ? (
                          <a 
                            href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-win-accent hover:underline text-xs font-mono"
                          >
                            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-win-text-tertiary">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-win-text-secondary">{record.country || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-win-text-secondary">{record.isp || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
