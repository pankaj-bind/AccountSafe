import React from 'react';
import { Shield, ShieldCheck, LockOpen, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBgColor: string;
  iconTextColor: string;
  trend?: number;
  grade?: string;
  gradeColor?: string;
}

interface SecurityStatsGridProps {
  healthScore: number;
  weakPasswords: number;
  reusedPasswords: number;
  breachedPasswords: number;
  totalCredentials: number;
}

interface GradeInfo {
  grade: string;
  color: string;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

const getGrade = (score: number): GradeInfo => {
  if (score >= 90) {
    return { grade: 'A+', color: 'text-green-500', label: 'Excellent' };
  } else if (score >= 80) {
    return { grade: 'A', color: 'text-green-600', label: 'Very Good' };
  } else if (score >= 70) {
    return { grade: 'B', color: 'text-blue-500', label: 'Good' };
  } else if (score >= 60) {
    return { grade: 'C', color: 'text-yellow-500', label: 'Fair' };
  } else {
    return { grade: 'F', color: 'text-red-500', label: 'Critical Risk' };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// StatCard Component
// ═══════════════════════════════════════════════════════════════════════════════

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  value, 
  label, 
  iconBgColor, 
  iconTextColor,
  trend,
  grade,
  gradeColor
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 transition-all hover:shadow-md dark:hover:border-zinc-700">
      {/* Icon with circular background */}
      <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${iconBgColor} ${iconTextColor} mb-2 sm:mb-3`}>
        {icon}
      </div>
      
      {/* Value and Grade */}
      <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
          {value}
        </div>
        {grade && (
          <div className={`text-lg sm:text-xl md:text-2xl font-bold ${gradeColor}`}>
            {grade}
          </div>
        )}
      </div>
      
      {/* Label */}
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium mb-1.5 sm:mb-2">
        {label}
      </div>

      {/* Trend Indicator */}
      {trend !== undefined && trend !== 0 && (
        <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium ${
          trend > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
        }`}>
          {trend > 0 ? (
            <>
              <ArrowUpRight className="w-3 h-3" />
              <span>+{trend}</span>
            </>
          ) : (
            <>
              <ArrowDownRight className="w-3 h-3" />
              <span>{trend}</span>
            </>
          )}
          <span className="text-zinc-400 dark:text-zinc-500 ml-1 hidden sm:inline">vs last week</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SecurityStatsGrid Component
// ═══════════════════════════════════════════════════════════════════════════════

export const SecurityStatsGrid: React.FC<SecurityStatsGridProps> = ({
  healthScore,
  weakPasswords,
  reusedPasswords,
  breachedPasswords,
  totalCredentials,
}) => {
  // Empty State: If no credentials exist, show neutral state
  const isEmpty = totalCredentials === 0;

  // Calculate grade for health score (only if credentials exist)
  const gradeInfo = isEmpty 
    ? { grade: '-', color: 'text-gray-500', label: 'No Data' }
    : getGrade(healthScore);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Security Score with Grade */}
      <StatCard
        icon={isEmpty ? <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> : <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
        value={isEmpty ? '0' : healthScore}
        label="Health Score"
        iconBgColor={isEmpty ? 'bg-gray-500/10' : 'bg-green-500/10'}
        iconTextColor={isEmpty ? 'text-gray-500' : 'text-green-500'}
        grade={gradeInfo.grade}
        gradeColor={gradeInfo.color}
        trend={isEmpty ? undefined : 5}
      />

      {/* Weak Passwords */}
      <StatCard
        icon={<LockOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
        value={weakPasswords}
        label="Weak Passwords"
        iconBgColor="bg-red-500/10"
        iconTextColor="text-red-500"
        trend={weakPasswords > 0 ? -2 : 0}
      />

      {/* Reused Passwords */}
      <StatCard
        icon={<RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />}
        value={reusedPasswords}
        label="Reused"
        iconBgColor="bg-orange-500/10"
        iconTextColor="text-orange-500"
        trend={reusedPasswords > 0 ? -1 : 0}
      />

      {/* Compromised/Breached */}
      <StatCard
        icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
        value={breachedPasswords}
        label="Breached"
        iconBgColor="bg-red-500/10"
        iconTextColor="text-red-500"
        trend={breachedPasswords > 0 ? 0 : 0}
      />
    </div>
  );
};
