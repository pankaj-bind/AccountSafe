/**
 * MAANG-grade skeleton loading components
 * Used for graceful loading states on slow networks
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded ${className}`}>
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-300/50 dark:via-zinc-700/50 to-transparent"
      animate={{ x: ['0%', '200%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

// Card skeleton for organization cards
export const CardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"
  >
    <div className="flex flex-col items-center">
      <Skeleton className="w-14 h-14 rounded-xl mb-3" />
      <Skeleton className="w-24 h-4 mb-2" />
      <Skeleton className="w-16 h-3" />
    </div>
  </motion.div>
);

// Grid skeleton for vault page
export const VaultGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="space-y-8">
    {/* Category header skeleton */}
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-9 h-9 rounded-lg" />
      <div>
        <Skeleton className="w-32 h-5 mb-1" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
    
    {/* Cards grid skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Stat card skeleton for dashboard
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
    <div className="flex items-start justify-between mb-4">
      <Skeleton className="w-11 h-11 rounded-xl" />
    </div>
    <Skeleton className="w-16 h-7 mb-2" />
    <Skeleton className="w-24 h-4" />
  </div>
);

// Table row skeleton for login records
export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-zinc-200 dark:border-zinc-800">
    <td className="py-4 px-4"><Skeleton className="w-20 h-6 rounded-full" /></td>
    <td className="py-4 px-4"><Skeleton className="w-24 h-4" /></td>
    <td className="py-4 px-4"><Skeleton className="w-28 h-5" /></td>
    <td className="py-4 px-4"><Skeleton className="w-20 h-4" /></td>
    <td className="py-4 px-4"><Skeleton className="w-24 h-4" /></td>
    <td className="py-4 px-4"><Skeleton className="w-16 h-4" /></td>
  </tr>
);

// Dashboard loading skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-zinc-950">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="w-40 h-8 mb-2" />
        <Skeleton className="w-64 h-5" />
      </div>
      
      {/* Stats grid skeleton */}
      <div className="mb-8">
        <Skeleton className="w-24 h-6 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <Skeleton className="w-32 h-6 mb-2" />
          <Skeleton className="w-48 h-4" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Profile page skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-xl" />
      <div>
        <Skeleton className="w-48 h-7 mb-2" />
        <Skeleton className="w-32 h-4" />
      </div>
    </div>
    
    {/* Credentials skeleton */}
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <Skeleton className="w-24 h-4 mb-3" />
          <Skeleton className="w-full h-10" />
        </div>
      ))}
    </div>
  </div>
);

// Empty state component with animation
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center py-12 sm:py-16"
  >
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center"
    >
      {icon}
    </motion.div>
    
    <motion.h3
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-lg font-semibold text-zinc-900 dark:text-white mb-2"
    >
      {title}
    </motion.h3>
    
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto"
    >
      {description}
    </motion.p>
    
    {action && (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={action.onClick}
        className="as-btn-primary"
      >
        {action.label}
      </motion.button>
    )}
  </motion.div>
);
