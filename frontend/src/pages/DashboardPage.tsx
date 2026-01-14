import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../contexts/ProfileContext';
import apiClient from '../api/apiClient';
import { formatLoginDateTime, formatNullableValue } from '../utils/formatters';
import { DashboardSkeleton } from '../components/Skeleton';

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

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const ShieldCheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const BuildingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

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

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Security Score Ring Component
// ═══════════════════════════════════════════════════════════════════════════════

interface SecurityScoreProps {
  score: number;
  size?: number;
}

const SecurityScoreRing: React.FC<SecurityScoreProps> = ({ score, size = 140 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  const getScoreColor = () => {
    if (score >= 80) return { color: '#22c55e', label: 'Excellent', class: 'text-green-400' };
    if (score >= 60) return { color: '#3b82f6', label: 'Good', class: 'text-blue-400' };
    if (score >= 40) return { color: '#f59e0b', label: 'Fair', class: 'text-yellow-400' };
    return { color: '#ef4444', label: 'Needs Attention', class: 'text-red-400' };
  };

  const scoreInfo = getScoreColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreInfo.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${scoreInfo.color}40)`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className={`text-xs font-medium ${scoreInfo.class}`}>{scoreInfo.label}</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Stat Card Component
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  trend?: { value: number; positive: boolean };
  color: 'blue' | 'green' | 'purple' | 'orange';
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color, href }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-50/50 dark:from-blue-500/10 dark:to-blue-500/5 border-blue-200 dark:border-blue-500/20',
    green: 'from-green-50 to-green-50/50 dark:from-green-500/10 dark:to-green-500/5 border-green-200 dark:border-green-500/20',
    purple: 'from-purple-50 to-purple-50/50 dark:from-purple-500/10 dark:to-purple-500/5 border-purple-200 dark:border-purple-500/20',
    orange: 'from-orange-50 to-orange-50/50 dark:from-orange-500/10 dark:to-orange-500/5 border-orange-200 dark:border-orange-500/20',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/15',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/15',
  };

  const content = (
    <div className={`relative group overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="relative">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${iconColorClasses[color]}`}>
            {icon}
          </div>
          {href && (
            <ArrowRightIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          )}
        </div>
        <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-1">{value}</p>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Login Record Row Component
// ═══════════════════════════════════════════════════════════════════════════════

const LoginRecordRow: React.FC<{ record: LoginRecord; isLast: boolean; index: number }> = ({ record, isLast, index }) => {
  const isSuccess = record.status === 'success';
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
          {isSuccess ? (
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
        <div className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-200" title={dateTime.fullDate}>
          {dateTime.relative}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-500">{dateTime.formatted}</div>
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
          <a
            href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
            aria-label={`View location on map: ${record.latitude}, ${record.longitude}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {Number(record.latitude).toFixed(2)}°, {Number(record.longitude).toFixed(2)}°
          </a>
        ) : (
          <span className="text-xs text-zinc-300 dark:text-zinc-600 italic">Coordinates unavailable</span>
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
  const failedLoginCount = stats?.recent_logins?.filter(l => l.status === 'failed').length || 0;

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
            Security Health Score
            ═══════════════════════════════════════════════════════════════════════ */}
        <section className="mb-6 sm:mb-8">
          <div className="as-card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                Security Health Score
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                Based on password strength, uniqueness, breach status, and hygiene
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {healthScore ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Score Ring */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <SecurityScoreRing score={Math.round(healthScore.overall_score)} />
                    <div className="text-center">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Based on {healthScore.total_passwords} password{healthScore.total_passwords !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Score Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Score Breakdown</h3>
                    
                    {/* Strength */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          Password Strength
                          <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-1">(40%)</span>
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {healthScore.strength_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${healthScore.strength_score}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {healthScore.breakdown.weak_passwords} weak password{healthScore.breakdown.weak_passwords !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Uniqueness */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          Password Uniqueness
                          <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-1">(30%)</span>
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {healthScore.uniqueness_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${healthScore.uniqueness_score}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {healthScore.breakdown.reused_passwords} reused password{healthScore.breakdown.reused_passwords !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Integrity */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          Password Integrity
                          <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-1">(20%)</span>
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {healthScore.integrity_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${healthScore.integrity_score}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {healthScore.breakdown.breached_passwords} breached password{healthScore.breakdown.breached_passwords !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Hygiene */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          Password Hygiene
                          <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-1">(10%)</span>
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {healthScore.hygiene_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${healthScore.hygiene_score}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {healthScore.breakdown.outdated_passwords} outdated password{healthScore.breakdown.outdated_passwords !== 1 ? 's' : ''} (&gt;1 year)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Loading security health score...
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

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
