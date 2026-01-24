// src/pages/TrashPage.tsx
/**
 * Trash Page - Recycle Bin for Deleted Credentials
 * 
 * Zero-Knowledge Compliant:
 * - All data displayed is encrypted and decrypted client-side
 * - Server only stores encrypted blobs
 * - Shredding permanently destroys encryption key material
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getTrashProfiles, restoreProfile, shredProfile, TrashProfile } from '../features/vault/services/vaultService';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const RestoreIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);

const ShredIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ArrowLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

const EmptyTrashIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Confirmation Modal Component
// ═══════════════════════════════════════════════════════════════════════════════

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6 max-w-md w-full mx-4"
      >
        <h3 className={`text-lg font-semibold mb-2 ${
          isDangerous ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          {message}
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Trash Item Card Component
// ═══════════════════════════════════════════════════════════════════════════════

interface TrashItemCardProps {
  profile: TrashProfile;
  onRestore: (id: number) => void;
  onShred: (id: number) => void;
  isRestoring: boolean;
  isShredding: boolean;
}

const TrashItemCard: React.FC<TrashItemCardProps> = ({
  profile,
  onRestore,
  onShred,
  isRestoring,
  isShredding,
}) => {
  const daysRemaining = profile.days_remaining;
  const isUrgent = daysRemaining <= 7;
  const isCritical = daysRemaining <= 3;

  // Format deleted date
  const deletedDate = new Date(profile.deleted_at);
  const formattedDate = deletedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 transition-all ${
        isCritical
          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : isUrgent
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
          : 'border-zinc-200 dark:border-zinc-700 opacity-75 hover:opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {profile.title || 'Untitled Profile'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Deleted on {formattedDate}
          </p>
          
          {/* Countdown Badge */}
          <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${
            isCritical
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : isUrgent
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}>
            <ClockIcon className="w-3.5 h-3.5" />
            {daysRemaining === 0 
              ? 'Expires today' 
              : daysRemaining === 1 
              ? 'Expires tomorrow'
              : `Expires in ${daysRemaining} days`
            }
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onRestore(profile.id)}
            disabled={isRestoring || isShredding}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isRestoring ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <RestoreIcon />
            )}
            Restore
          </button>
          
          <button
            onClick={() => onShred(profile.id)}
            disabled={isRestoring || isShredding}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isShredding ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <ShredIcon />
            )}
            Delete Forever
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

const TrashSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 animate-pulse"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-48" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-32 mt-2" />
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full w-36 mt-3" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-24" />
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-32" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Main Trash Page Component
// ═══════════════════════════════════════════════════════════════════════════════

const TrashPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<TrashProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Action states
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [shreddingId, setShreddingId] = useState<number | null>(null);
  
  // Modal state
  const [showShredModal, setShowShredModal] = useState(false);
  const [profileToShred, setProfileToShred] = useState<number | null>(null);

  // Fetch trash profiles
  const fetchTrash = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTrashProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Failed to fetch trash:', err);
      setError('Failed to load trash. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  // Handle restore
  const handleRestore = async (id: number) => {
    try {
      setRestoringId(id);
      await restoreProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to restore profile:', err);
      setError('Failed to restore profile. Please try again.');
    } finally {
      setRestoringId(null);
    }
  };

  // Handle shred initiation (show modal)
  const handleShredClick = (id: number) => {
    setProfileToShred(id);
    setShowShredModal(true);
  };

  // Handle confirmed shred
  const handleShredConfirm = async () => {
    if (!profileToShred) return;
    
    try {
      setShreddingId(profileToShred);
      await shredProfile(profileToShred);
      setProfiles((prev) => prev.filter((p) => p.id !== profileToShred));
      setShowShredModal(false);
      setProfileToShred(null);
    } catch (err) {
      console.error('Failed to shred profile:', err);
      setError('Failed to permanently delete profile. Please try again.');
    } finally {
      setShreddingId(null);
    }
  };

  // Calculate summary stats
  const urgentCount = profiles.filter((p) => p.days_remaining <= 7).length;
  const criticalCount = profiles.filter((p) => p.days_remaining <= 3).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Trash
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Deleted credentials are kept for 30 days before permanent removal
              </p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        {criticalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <ShredIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  {criticalCount} {criticalCount === 1 ? 'item' : 'items'} expiring soon!
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                  These items will be permanently deleted within 3 days. Restore them now if needed.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        {!isLoading && profiles.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {profiles.length}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Total in Trash
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-amber-700 p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {urgentCount}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Expiring in 7 days
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-700 p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {criticalCount}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Expiring in 3 days
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Content */}
        {isLoading ? (
          <TrashSkeleton />
        ) : profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <EmptyTrashIcon className="w-20 h-20 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Trash is empty
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Deleted credentials will appear here for 30 days before being permanently removed.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {profiles.map((profile) => (
                <TrashItemCard
                  key={profile.id}
                  profile={profile}
                  onRestore={handleRestore}
                  onShred={handleShredClick}
                  isRestoring={restoringId === profile.id}
                  isShredding={shreddingId === profile.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Zero-Knowledge Notice */}
        <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Zero-Knowledge Security
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Your deleted credentials remain encrypted. When permanently deleted, the encryption data is crypto-shredded, 
                making recovery impossible even with database access. The server never sees your plaintext passwords.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shred Confirmation Modal */}
      <AnimatePresence>
        {showShredModal && (
          <ConfirmModal
            isOpen={showShredModal}
            title="Permanently Delete?"
            message="This action cannot be undone. The encrypted data will be crypto-shredded, making recovery impossible. Are you sure you want to permanently delete this credential?"
            confirmText="Delete Forever"
            onConfirm={handleShredConfirm}
            onCancel={() => {
              setShowShredModal(false);
              setProfileToShred(null);
            }}
            isDangerous
            isLoading={shreddingId !== null}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrashPage;
