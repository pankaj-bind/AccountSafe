import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../contexts/ProfileContext';
import apiClient from '../api/apiClient';
import { formatLoginDateTime, formatNullableValue } from '../utils/formatters';
import { DashboardSkeleton } from '../components/Skeleton';
import { SecurityStatsGrid } from '../components/SecurityStatsGrid';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface DashboardStats {
  organization_count: number;
  profile_count: number;
  recent_logins: LoginRecord[];
}

interface SecurityHealthScore {
  overall_score: number;
  total_passwords: number;
  strength_score: number;
  uniqueness_score: number;
  integrity_score: number;
  hygiene_score: number;
  breakdown: {
    weak_passwords: number;
    reused_passwords: number;
    breached_passwords: number;
    outdated_passwords: number;
  };
}

interface LoginRecord {
  id: number;
  username_attempted: string;
  password_attempted: string | null;
  status: 'success' | 'failed' | 'duress';
  is_duress: boolean;
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

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const ActivityIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// Login Record Row Component
// ═══════════════════════════════════════════════════════════════════════════════

const LoginRecordRow: React.FC<{ record: LoginRecord; isLast: boolean; index: number }> = ({ record, isLast, index }) => {
  const isSuccess = record.status === 'success' || record.status === 'duress';
  const isDuress = record.is_duress || record.status === 'duress';
  const dateTime = formatLoginDateTime(record.date, record.time);
  const country = formatNullableValue(record.country, { type: 'location' });
  const isp = formatNullableValue(record.isp, { type: 'isp' });
  const ip = formatNullableValue(record.ip_address, { type: 'ip' });

  return (
    <motion.tr 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={`group transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/50`}
    >
      <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/50 py-3 sm:py-4 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          {isDuress ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Duress</span>
            </div>
          ) : isSuccess ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 whitespace-nowrap">
              <CheckCircleIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Success</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 whitespace-nowrap">
              <XCircleIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">Failed</span>
            </div>
          )}
        </div>
      </td>
      <td className="py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
        <div className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-200">
          {dateTime.relative}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-500">{dateTime.timeOnly}</div>
      </td>
      <td className="py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
        <code className={`text-xs sm:text-sm font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
          ip.isUnknown 
            ? 'text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 italic' 
            : 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800'
        }`}>
          {ip.display}
        </code>
      </td>
      <td className="py-3 sm:py-4 px-3 sm:px-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {country.isUnknown ? (
            <svg className="w-3 sm:w-4 h-3 sm:h-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          ) : (
            <GlobeIcon className="w-3 sm:w-4 h-3 sm:h-4 text-zinc-400 dark:text-zinc-500" />
          )}
          <span className={`text-xs sm:text-sm ${
            country.isUnknown 
              ? 'text-zinc-400 dark:text-zinc-500 italic' 
              : 'text-zinc-700 dark:text-zinc-300'
          }`}>
            {country.display}
          </span>
        </div>
      </td>
      <td className="py-3 sm:py-4 px-3 sm:px-4">
        <span className={`text-xs sm:text-sm ${
          isp.isUnknown 
            ? 'text-zinc-400 dark:text-zinc-500 italic' 
            : 'text-zinc-600 dark:text-zinc-400'
        }`}>
          {isp.display}
        </span>
      </td>
      <td className="py-3 sm:py-4 px-3 sm:px-4">
        {record.latitude != null && record.longitude != null ? (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <a
              href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
              aria-label={`View location on map: ${record.latitude}, ${record.longitude}`}
            >
              {Number(record.latitude).toFixed(2)}°, {Number(record.longitude).toFixed(2)}°
            </a>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-600 italic">Not available</span>
        )}
      </td>
    </motion.tr>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Dashboard Component
// ═══════════════════════════════════════════════════════════════════════════════

const DashboardPage: React.FC = () => {
  const { displayName } = useProfile();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [healthScore, setHealthScore] = useState<SecurityHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [allRecords, setAllRecords] = useState<LoginRecord[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, healthResponse] = await Promise.all([
        apiClient.get('/dashboard/statistics/'),
        apiClient.get('/security/health-score/')
      ]);
      setStats(statsResponse.data);
      setHealthScore(healthResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats({
        organization_count: 0,
        profile_count: 0,
        recent_logins: []
      });
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

  const displayRecords = showAllRecords ? allRecords : (stats?.recent_logins || []);

  // Loading state - use skeleton loader for MAANG-grade UX
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* ═══════════════════════════════════════════════════════════════════════
            Page Header
            ═══════════════════════════════════════════════════════════════════════ */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
            Welcome back, <span className="text-zinc-900 dark:text-zinc-200 font-medium">{displayName}</span>
          </p>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════════
            Security Stats Grid
            ═══════════════════════════════════════════════════════════════════════ */}
        {healthScore && (
          <section className="mb-6 sm:mb-8">
            <SecurityStatsGrid
              healthScore={Math.round(healthScore.overall_score)}
              weakPasswords={healthScore.breakdown.weak_passwords}
              reusedPasswords={healthScore.breakdown.reused_passwords}
              breachedPasswords={healthScore.breakdown.breached_passwords}
              totalCredentials={healthScore.total_passwords}
            />
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            Login Records Table
            ═══════════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="as-card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {/* Table Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">Login Activity</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500">Monitor your recent login attempts and locations</p>
              </div>
              {!showAllRecords && stats?.recent_logins && stats.recent_logins.length > 0 && (
                <button
                  onClick={fetchAllLoginRecords}
                  className="text-xs sm:text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  View All
                </button>
              )}
            </div>

            {/* Table Content */}
            {displayRecords.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center">
                  <ActivityIcon className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-zinc-900 dark:text-white mb-2">No login records yet</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Your login activity will appear here once you start using your account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-xs sm:text-sm">
                      <th className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-900/50 text-left py-3 px-3 sm:px-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Status</th>
                      <th className="text-left py-3 px-3 sm:px-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Date & Time</th>
                      <th className="text-left py-3 px-3 sm:px-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">IP Address</th>
                      <th className="text-left py-3 px-3 sm:px-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Location</th>
                      <th className="text-left py-3 px-3 sm:px-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">ISP</th>
                      <th className="text-left py-3 px-3 sm:px-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    <AnimatePresence>
                      {displayRecords.map((record, index) => (
                        <LoginRecordRow
                          key={record.id}
                          record={record}
                          isLast={index === displayRecords.length - 1}
                          index={index}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
