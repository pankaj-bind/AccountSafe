// src/features/vault/components/ProfileManager.tsx
/**
 * ProfileManager - Container Component
 * 
 * RESPONSIBILITY: Orchestrate the vault feature
 * - Calls useProfiles() hook for data/state management
 * - Passes data down to presentational components
 * - Manages UI state (modals, visibility toggles)
 * 
 * ZERO LOGIC in JSX - All business logic lives in the hook layer.
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

// Context
import { useCrypto } from '../../../services/CryptoContext';

// Hooks
import { useProfiles } from '../hooks/useProfiles';
import { useClipboard } from '../../../hooks/useClipboard';
import { usePwnedCheck } from '../../../hooks/usePwnedCheck';
import { useDuplicatePasswordCheck } from '../../../hooks/useDuplicatePasswordCheck';
import { trackAccess } from '../../../utils/frequencyTracker';

// Components
import ProfileList from './ProfileList';
import ImportCredentialsModal from './ImportCredentialsModal';
import PasswordReentryModal from '../../../components/PasswordReentryModal';
import BreachWarning from '../../../components/BreachWarning';
import DuplicatePasswordWarning from '../../../components/DuplicatePasswordWarning';
import { CreditCard, CARD_DESIGNS, CARD_NETWORKS } from './cards';
import type { CardDesignType, CardNetworkType } from './cards';

// Utils
import { generatePassword, getPasswordStrength } from '../../../utils/passwordGenerator';

// Types
import type {
  Organization,
  Profile,
  ProfileFormData,
  CreditCardFormData,
  FieldVisibility,
  ExpandedState,
} from '../types/profile.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Icon Components
// ═══════════════════════════════════════════════════════════════════════════════

const ArrowLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const UserIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const NotesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Digital Wallet Documents
// ═══════════════════════════════════════════════════════════════════════════════

const digitalWalletDocuments = [
  { id: "passport", label: "Passport", category: "Identity", icon: "/logo/passport.png" },
  { id: "driving_license", label: "Driving License", category: "Identity", icon: "/logo/driving license.png" },
  { id: "pan_card", label: "PAN Card", category: "Identity", icon: "/logo/pan card.png" },
  { id: "bank_card", label: "Credit / Debit Card", category: "Finance", icon: "/logo/credit card.png" },
  { id: "travel_card", label: "Travel / Forex Card", category: "Finance", icon: "/logo/travel-card.png" },
  { id: "employee_id", label: "Work ID / Corporate", category: "Professional", icon: "/logo/work id.png" },
  { id: "student_id", label: "Student ID (ISIC)", category: "Education", icon: "/logo/student id.png" },
  { id: "health_insurance", label: "Health Insurance", category: "Health", icon: "/logo/health insurance.png" },
  { id: "vaccine_cert", label: "Vaccination Cert", category: "Health", icon: "/logo/vaccination certificate.png" },
  { id: "membership", label: "Membership / Loyalty", category: "Lifestyle", icon: "/logo/membership card.png" }
];

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileManagerProps {
  organization: Organization;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const ProfileManager: React.FC<ProfileManagerProps> = ({ organization, onBack }) => {
  // ─────────────────────────────────────────────────────────────────────────────
  // Context & Hooks
  // ─────────────────────────────────────────────────────────────────────────────
  const { getMasterKey } = useCrypto();
  const { copy: secureCopy } = useClipboard({ clearAfter: 30000 });

  // Main data hook
  const {
    profiles,
    organization: orgData,
    isLoading,
    error,
    success,
    recoveryCodes,
    needsPasswordReentry,
    fetchProfiles,
    addProfile,
    editProfile,
    removeProfile,
    togglePinProfile,
    updateRecoveryCodes,
    addCreditCard,
    editCreditCard,
    parseCreditCardData,
    createShareLink,
    clearError,
    clearSuccess,
    setNeedsPasswordReentry,
  } = useProfiles(organization.id, organization, getMasterKey);

  // ─────────────────────────────────────────────────────────────────────────────
  // Local UI State
  // ─────────────────────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState<FieldVisibility>({});
  const [showUsername, setShowUsername] = useState<FieldVisibility>({});
  const [showEmail, setShowEmail] = useState<FieldVisibility>({});
  const [expandedCard, setExpandedCard] = useState<ExpandedState>({});
  const [expandedNotes, setExpandedNotes] = useState<ExpandedState>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [newProfile, setNewProfile] = useState<ProfileFormData>({
    title: '',
    username: '',
    password: '',
    email: '',
    recovery_codes: '',
    notes: '',
  });

  // Credit Card form state
  const [creditCardData, setCreditCardData] = useState<CreditCardFormData>({
    bankName: '',
    cardNetwork: '',
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
    design: 'sbi',
  });

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProfileId, setShareProfileId] = useState<number | null>(null);
  const [shareExpiryHours, setShareExpiryHours] = useState(24);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Derived state
  const isCreditCardOrg = orgData?.name === 'Credit / Debit Card';

  // Real-time security checks
  const { breachCount, isChecking: isBreachChecking, error: breachError } = usePwnedCheck(newProfile.password);
  const { duplicateCount, duplicates, isChecking: isDuplicateChecking, error: duplicateError } = useDuplicatePasswordCheck(
    newProfile.password,
    editingProfile?.id,
    getMasterKey
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleCopyToClipboard = useCallback(async (text: string, field: string) => {
    const profileId = field.split('-').pop();
    if (profileId) {
      trackAccess(profileId, 'profile');
    }
    const copied = await secureCopy(text);
    if (copied) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, [secureCopy]);

  const handleTogglePassword = useCallback((profileId: number) => {
    trackAccess(profileId, 'profile');
    setShowPassword(prev => ({ ...prev, [profileId]: !prev[profileId] }));
  }, []);

  const handleToggleUsername = useCallback((profileId: number) => {
    trackAccess(profileId, 'profile');
    setShowUsername(prev => ({ ...prev, [profileId]: !prev[profileId] }));
  }, []);

  const handleToggleEmail = useCallback((profileId: number) => {
    trackAccess(profileId, 'profile');
    setShowEmail(prev => ({ ...prev, [profileId]: !prev[profileId] }));
  }, []);

  const handleToggleNotes = useCallback((profileId: number) => {
    setExpandedNotes(prev => ({ ...prev, [profileId]: !prev[profileId] }));
  }, []);

  const handleToggleExpand = useCallback((profileId: number) => {
    setExpandedCard(prev => ({ ...prev, [profileId]: !prev[profileId] }));
  }, []);

  const handleCopyRecoveryCode = useCallback(async (profileId: number, code: string, index: number) => {
    const copied = await secureCopy(code);
    if (copied) {
      setCopiedField(`recovery-${profileId}-${index}`);
      setTimeout(() => setCopiedField(null), 1000);

      // Remove the copied code
      const currentCodes = recoveryCodes[profileId] || [];
      const updatedCodes = currentCodes.filter((_, i) => i !== index);
      await updateRecoveryCodes(profileId, updatedCodes);
    }
  }, [secureCopy, recoveryCodes, updateRecoveryCodes]);

  const handleEditProfile = useCallback((profile: Profile) => {
    setEditingProfile(profile);
    if (isCreditCardOrg) {
      setCreditCardData(parseCreditCardData(profile));
    } else {
      setNewProfile({
        title: profile.title || '',
        username: profile.username || '',
        password: profile.password || '',
        email: profile.email || '',
        recovery_codes: profile.recovery_codes || '',
        notes: profile.notes || '',
      });
    }
    setShowModal(true);
    clearError();
  }, [isCreditCardOrg, parseCreditCardData, clearError]);

  const handleDeleteProfile = useCallback(async (profileId: number) => {
    if (!window.confirm('Delete this profile?')) return;
    await removeProfile(profileId);
  }, [removeProfile]);

  const handleShareProfile = useCallback((profileId: number) => {
    setShareProfileId(profileId);
    setShowShareModal(true);
  }, []);

  const handleCreateShareLink = useCallback(async () => {
    if (!shareProfileId) return;
    const url = await createShareLink(shareProfileId, shareExpiryHours);
    if (url) {
      setShareUrl(url);
    }
  }, [shareProfileId, shareExpiryHours, createShareLink]);

  const handleCopyShareLink = useCallback(async () => {
    if (shareUrl) {
      const copied = await secureCopy(shareUrl);
      if (copied) {
        setCopiedShare(true);
        setTimeout(() => {
          setCopiedShare(false);
          setShowShareModal(false);
          setShareUrl(null);
          setShareProfileId(null);
          setShareExpiryHours(24);
        }, 2000);
      }
    }
  }, [shareUrl, secureCopy]);

  const handleCreateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProfile) {
      const result = await editProfile(editingProfile.id, newProfile, selectedFile);
      if (result) {
        setShowModal(false);
        setEditingProfile(null);
        setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
        setSelectedFile(null);
      }
    } else {
      const result = await addProfile(newProfile, selectedFile);
      if (result) {
        setShowModal(false);
        setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
        setSelectedFile(null);
      }
    }
  }, [editingProfile, newProfile, selectedFile, addProfile, editProfile]);

  const handleCreateCreditCard = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProfile) {
      const result = await editCreditCard(editingProfile.id, creditCardData);
      if (result) {
        setShowModal(false);
        setEditingProfile(null);
        setCreditCardData({ bankName: '', cardNetwork: '', cardNumber: '', cardHolder: '', expiry: '', cvv: '', design: 'sbi' });
      }
    } else {
      const result = await addCreditCard(creditCardData);
      if (result) {
        setShowModal(false);
        setCreditCardData({ bankName: '', cardNetwork: '', cardNumber: '', cardHolder: '', expiry: '', cvv: '', design: 'sbi' });
      }
    }
  }, [editingProfile, creditCardData, addCreditCard, editCreditCard]);

  const cycleCardDesign = useCallback(() => {
    const currentIndex = CARD_DESIGNS.findIndex(d => d.id === creditCardData.design);
    const nextIndex = (currentIndex + 1) % CARD_DESIGNS.length;
    setCreditCardData(prev => ({ ...prev, design: CARD_DESIGNS[nextIndex].id }));
  }, [creditCardData.design]);

  const handlePasswordReentrySuccess = useCallback(() => {
    setNeedsPasswordReentry(false);
    fetchProfiles();
  }, [setNeedsPasswordReentry, fetchProfiles]);

  const handlePasswordReentryCancel = useCallback(() => {
    setNeedsPasswordReentry(false);
    onBack();
  }, [setNeedsPasswordReentry, onBack]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingProfile(null);
    setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
    setCreditCardData({ bankName: '', cardNetwork: '', cardNumber: '', cardHolder: '', expiry: '', cvv: '', design: 'sbi' });
    setSelectedFile(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render Organization Logo
  // ─────────────────────────────────────────────────────────────────────────────
  const renderOrgLogo = () => {
    const docMatch = digitalWalletDocuments.find(d => d.label === orgData?.name);

    if (docMatch) {
      return (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 flex-shrink-0 border border-zinc-200 dark:border-zinc-700 p-2">
          <img src={docMatch.icon} alt={orgData?.name} className="w-full h-full object-contain" />
        </div>
      );
    }
    
    if (orgData?.logo_url) {
      return (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
          <img src={orgData.logo_url} alt={orgData?.name} className="w-full h-full object-contain p-2 bg-white dark:bg-transparent" />
        </div>
      );
    }

    return (
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
        <span className="text-white font-bold text-lg sm:text-xl">
          {orgData?.name ? orgData.name.charAt(0).toUpperCase() : 'O'}
        </span>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--as-bg-base)]">
      {/* Password Re-entry Modal */}
      <PasswordReentryModal
        isOpen={needsPasswordReentry}
        onSuccess={handlePasswordReentrySuccess}
        onCancel={handlePasswordReentryCancel}
      />

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          shareUrl={shareUrl}
          shareExpiryHours={shareExpiryHours}
          copiedShare={copiedShare}
          onExpiryChange={setShareExpiryHours}
          onCreateLink={handleCreateShareLink}
          onCopyLink={handleCopyShareLink}
          onClose={() => {
            setShowShareModal(false);
            setShareUrl(null);
            setShareProfileId(null);
            setShareExpiryHours(24);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          aria-label="Back to Vault"
          className="mb-2 sm:mb-4 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm sm:text-base">Back to Vault</span>
        </button>

        {/* Organization Header */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {renderOrgLogo()}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white truncate">
                {orgData?.name || 'Loading...'}
              </h1>
              <span className="text-zinc-400 text-xs sm:text-sm">
                {profiles.length} {profiles.length === 1 ? 'credential' : 'credentials'}
              </span>
            </div>
          </div>

          {/* Add Profile Button */}
          <button
            onClick={() => { setShowModal(true); clearError(); }}
            className="as-btn-primary px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 group flex-shrink-0 shadow-lg"
            title="Add Credential"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90" />
            <span className="hidden sm:inline text-sm font-semibold">Add New Credentials</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* Success Alert */}
        {success && (
          <Alert type="success" message={success} onClose={clearSuccess} />
        )}

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Empty State */}
        {!isLoading && profiles.length === 0 && (
          <EmptyState 
            onAddClick={() => { setShowModal(true); clearError(); }} 
            onImportClick={() => setShowImportModal(true)}
          />
        )}

        {/* Profile List */}
        {!isLoading && profiles.length > 0 && (
          <ProfileList
            profiles={profiles}
            recoveryCodes={recoveryCodes}
            isCreditCardOrg={isCreditCardOrg}
            showPassword={showPassword}
            showUsername={showUsername}
            showEmail={showEmail}
            expandedNotes={expandedNotes}
            expandedCard={expandedCard}
            copiedField={copiedField}
            onEdit={handleEditProfile}
            onDelete={handleDeleteProfile}
            onShare={handleShareProfile}
            onTogglePin={togglePinProfile}
            onCopy={handleCopyToClipboard}
            onTogglePassword={handleTogglePassword}
            onToggleUsername={handleToggleUsername}
            onToggleEmail={handleToggleEmail}
            onToggleNotes={handleToggleNotes}
            onToggleExpand={handleToggleExpand}
            onCopyRecoveryCode={handleCopyRecoveryCode}
            parseCreditCardData={parseCreditCardData}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <ProfileFormModal
          isCreditCardOrg={isCreditCardOrg}
          editingProfile={editingProfile}
          newProfile={newProfile}
          creditCardData={creditCardData}
          breachCount={breachCount}
          isBreachChecking={isBreachChecking}
          breachError={breachError}
          duplicateCount={duplicateCount}
          duplicates={duplicates}
          isDuplicateChecking={isDuplicateChecking}
          duplicateError={duplicateError}
          onClose={closeModal}
          onProfileChange={setNewProfile}
          onCreditCardChange={setCreditCardData}
          onFileChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
          onSubmitProfile={handleCreateProfile}
          onSubmitCreditCard={handleCreateCreditCard}
          onCycleCardDesign={cycleCardDesign}
          onGeneratePassword={() => {
            const pwd = generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true });
            setNewProfile(prev => ({ ...prev, password: pwd }));
          }}
        />
      )}

      {/* Import Credentials Modal */}
      <ImportCredentialsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          setShowImportModal(false);
          fetchProfiles();
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components (Extracted for cleaner JSX)
// ═══════════════════════════════════════════════════════════════════════════════

const Alert: React.FC<{ type: 'error' | 'success'; message: string; onClose: () => void }> = ({
  type,
  message,
  onClose
}) => (
  <div className={`${type === 'error' ? 'as-alert-danger' : 'as-alert-success'} mb-6 flex items-center justify-between`}>
    <div className="flex items-center gap-3">
      {type === 'error' ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ) : (
        <CheckIcon className="w-5 h-5 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
    <button onClick={onClose} className="hover:opacity-70 transition-opacity">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-zinc-700 rounded-full" />
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
    </div>
    <p className="mt-6 text-zinc-400">Loading credentials...</p>
  </div>
);

const EmptyState: React.FC<{ onAddClick: () => void; onImportClick?: () => void }> = ({ onAddClick, onImportClick }) => (
  <div className="as-card p-12 text-center">
    <div className="w-20 h-20 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <KeyIcon className="w-10 h-10 text-zinc-600" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">No credentials yet</h3>
    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
      Add your first credential to start storing passwords, emails, and recovery codes securely.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button onClick={onAddClick} className="as-btn-primary inline-flex items-center justify-center gap-2">
        <span className="sm:hidden"><PlusIcon className="w-5 h-5" /></span>
        <span className="hidden sm:inline">+ Add New Credentials</span>
      </button>
      {onImportClick && (
        <button onClick={onImportClick} className="as-btn-secondary inline-flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span>Import from Browser</span>
        </button>
      )}
    </div>
  </div>
);

// Share Modal Component
const ShareModal: React.FC<{
  shareUrl: string | null;
  shareExpiryHours: number;
  copiedShare: boolean;
  onExpiryChange: (hours: number) => void;
  onCreateLink: () => void;
  onCopyLink: () => void;
  onClose: () => void;
}> = ({ shareUrl, shareExpiryHours, copiedShare, onExpiryChange, onCreateLink, onCopyLink, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-[var(--as-bg-card)] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Share Credential</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Create a one-time secure link</p>
        </div>
      </div>

      {!shareUrl ? (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Link Expiry</label>
              <select
                value={shareExpiryHours}
                onChange={(e) => onExpiryChange(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white dark:bg-[var(--as-bg-base)] border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours (1 day)</option>
                <option value={48}>48 hours (2 days)</option>
                <option value={72}>72 hours (3 days)</option>
                <option value={168}>1 week</option>
              </select>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-200">
                <strong>Security Notice:</strong> Link can only be viewed once and will be permanently destroyed after viewing.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button onClick={onCreateLink} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg">
              Create Link
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {/* QR Code Display */}
            <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-6">
              <div className="mb-4 text-center">
                <h4 className="text-zinc-900 dark:text-white font-semibold text-lg mb-1">Scan QR Code</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Quick access for mobile devices</p>
              </div>
              <div className="relative bg-white p-4 rounded-2xl shadow-2xl mb-4">
                <canvas
                  ref={(canvas) => {
                    if (canvas && shareUrl) {
                      QRCode.toCanvas(canvas, shareUrl, {
                        width: 220,
                        margin: 2,
                        color: { dark: '#1e293b', light: '#ffffff' },
                        errorCorrectionLevel: 'H'
                      }).catch(err => console.error('QR Code error:', err));
                    }
                  }}
                  className="rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Share Link (Expires in {shareExpiryHours} hour{shareExpiryHours > 1 ? 's' : ''})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-[var(--as-bg-base)] border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={onCopyLink}
                  className={`px-4 py-3 rounded-lg transition-colors ${copiedShare ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  {copiedShare ? <CheckIcon className="w-5 h-5" /> : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onCopyLink}
            className={`w-full px-4 py-3 rounded-lg transition-all font-medium shadow-lg ${copiedShare ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}`}
          >
            {copiedShare ? 'Copied!' : 'Copy Link & Close'}
          </button>
        </>
      )}
    </motion.div>
  </div>
);

// Profile Form Modal - Simplified props interface
interface ProfileFormModalProps {
  isCreditCardOrg: boolean;
  editingProfile: Profile | null;
  newProfile: ProfileFormData;
  creditCardData: CreditCardFormData;
  breachCount: number | null;
  isBreachChecking: boolean;
  breachError: string | null;
  duplicateCount: number;
  duplicates: Array<{ id: number; title: string; organizationName: string; organizationId: number }>;
  isDuplicateChecking: boolean;
  duplicateError: string | null;
  onClose: () => void;
  onProfileChange: (data: ProfileFormData) => void;
  onCreditCardChange: (data: CreditCardFormData) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitProfile: (e: React.FormEvent) => void;
  onSubmitCreditCard: (e: React.FormEvent) => void;
  onCycleCardDesign: () => void;
  onGeneratePassword: () => void;
}

const ProfileFormModal: React.FC<ProfileFormModalProps> = ({
  isCreditCardOrg,
  editingProfile,
  newProfile,
  creditCardData,
  breachCount,
  isBreachChecking,
  breachError,
  duplicateCount,
  duplicates,
  isDuplicateChecking,
  duplicateError,
  onClose,
  onProfileChange,
  onCreditCardChange,
  onFileChange,
  onSubmitProfile,
  onSubmitCreditCard,
  onCycleCardDesign,
  onGeneratePassword,
}) => (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]"
    onClick={onClose}
  >
    <div
      className="as-modal w-full max-w-lg max-h-[90vh] overflow-y-auto animate-[modalIn_0.3s_ease-out]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCreditCardOrg ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
            {isCreditCardOrg ? (
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            ) : (
              <KeyIcon className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-white">
            {isCreditCardOrg
              ? (editingProfile ? 'Edit Card' : 'Add Card')
              : (editingProfile ? 'Edit Credential' : 'Add Credential')
            }
          </h3>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form Content */}
      {isCreditCardOrg ? (
        <CreditCardForm
          data={creditCardData}
          editingProfile={editingProfile}
          onChange={onCreditCardChange}
          onSubmit={onSubmitCreditCard}
          onClose={onClose}
          onCycleDesign={onCycleCardDesign}
        />
      ) : (
        <ProfileForm
          data={newProfile}
          editingProfile={editingProfile}
          breachCount={breachCount}
          isBreachChecking={isBreachChecking}
          breachError={breachError}
          duplicateCount={duplicateCount}
          duplicates={duplicates}
          isDuplicateChecking={isDuplicateChecking}
          duplicateError={duplicateError}
          onChange={onProfileChange}
          onFileChange={onFileChange}
          onSubmit={onSubmitProfile}
          onClose={onClose}
          onGeneratePassword={onGeneratePassword}
        />
      )}
    </div>
  </div>
);

// Credit Card Form
const CreditCardForm: React.FC<{
  data: CreditCardFormData;
  editingProfile: Profile | null;
  onChange: (data: CreditCardFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onCycleDesign: () => void;
}> = ({ data, editingProfile, onChange, onSubmit, onClose, onCycleDesign }) => (
  <form onSubmit={onSubmit} className="p-6 space-y-5">
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Name of Bank <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        value={data.bankName}
        onChange={(e) => onChange({ ...data, bankName: e.target.value })}
        placeholder="e.g., Chase, Bank of America"
        className="as-input w-full"
        required
        autoFocus
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Card Network <span className="text-red-400">*</span>
      </label>
      <select
        value={data.cardNetwork}
        onChange={(e) => onChange({ ...data, cardNetwork: e.target.value })}
        className="as-input w-full"
        required
      >
        {CARD_NETWORKS.map((network) => (
          <option key={network.id} value={network.id}>
            {network.id === '' ? 'Select card network' : network.name}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Card Number <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        value={data.cardNumber}
        onChange={(e) => onChange({ ...data, cardNumber: e.target.value.replace(/[^\d\s]/g, '').slice(0, 19) })}
        placeholder="1234 5678 9012 3456"
        className="as-input w-full font-mono text-lg tracking-wider"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Account Holder Name <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        value={data.cardHolder}
        onChange={(e) => onChange({ ...data, cardHolder: e.target.value.toUpperCase() })}
        placeholder="JOHN DOE"
        className="as-input w-full uppercase tracking-wide"
        required
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Expiry <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.expiry}
          onChange={(e) => {
            let value = e.target.value.replace(/[^\d]/g, '');
            if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
            onChange({ ...data, expiry: value });
          }}
          placeholder="MM/YY"
          maxLength={5}
          className="as-input w-full font-mono text-center text-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          CVV <span className="text-red-400">*</span>
        </label>
        <input
          type="password"
          value={data.cvv}
          onChange={(e) => onChange({ ...data, cvv: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
          placeholder="•••"
          maxLength={4}
          className="as-input w-full font-mono text-center text-lg"
          required
        />
      </div>
    </div>

    {/* Card Preview */}
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">Card Preview (click to change theme)</p>
      </div>
      <div onClick={onCycleDesign} className="cursor-pointer transition-transform hover:scale-[1.02]">
        <CreditCard
          design={data.design as CardDesignType}
          bankName={data.bankName || undefined}
          cardNetwork={data.cardNetwork as CardNetworkType || undefined}
          cardNumber={data.cardNumber || undefined}
          cardHolder={data.cardHolder || undefined}
          expiryDate={data.expiry || undefined}
          showDetails={true}
        />
      </div>
    </div>

    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="as-btn-secondary flex-1">Cancel</button>
      <button type="submit" className="as-btn-primary flex-1">{editingProfile ? 'Save Changes' : 'Add Card'}</button>
    </div>
  </form>
);

// Profile Form
const ProfileForm: React.FC<{
  data: ProfileFormData;
  editingProfile: Profile | null;
  breachCount: number | null;
  isBreachChecking: boolean;
  breachError: string | null;
  duplicateCount: number;
  duplicates: Array<{ id: number; title: string; organizationName: string; organizationId: number }>;
  isDuplicateChecking: boolean;
  duplicateError: string | null;
  onChange: (data: ProfileFormData) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onGeneratePassword: () => void;
}> = ({
  data,
  editingProfile,
  breachCount,
  isBreachChecking,
  breachError,
  duplicateCount,
  duplicates,
  isDuplicateChecking,
  duplicateError,
  onChange,
  onFileChange,
  onSubmit,
  onClose,
  onGeneratePassword,
}) => {
  const passwordStrength = data.password ? getPasswordStrength(data.password) : null;

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="flex items-center gap-2"><NotesIcon className="w-4 h-4 text-zinc-500" /> Title</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="e.g., Admin Account"
          className="as-input w-full"
          autoFocus
        />
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-zinc-500" /> Username</span>
        </label>
        <input
          type="text"
          value={data.username}
          onChange={(e) => onChange({ ...data, username: e.target.value })}
          placeholder="e.g., john_doe"
          className="as-input w-full"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="flex items-center gap-2"><KeyIcon className="w-4 h-4 text-zinc-500" /> Password</span>
        </label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={data.password}
              onChange={(e) => onChange({ ...data, password: e.target.value })}
              placeholder="Enter or generate password"
              className="as-input flex-1 font-mono"
            />
            <button
              type="button"
              onClick={onGeneratePassword}
              className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-all flex items-center gap-2"
              title="Generate strong password"
            >
              <SparklesIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Generate</span>
            </button>
          </div>

          {/* Password Strength */}
          {passwordStrength && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.color === 'green' ? 'bg-emerald-500' :
                      passwordStrength.color === 'blue' ? 'bg-blue-500' :
                      passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength.color === 'green' ? 'text-emerald-400' :
                  passwordStrength.color === 'blue' ? 'text-blue-400' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          {/* Security Warnings */}
          {data.password && (
            <>
              <BreachWarning breachCount={breachCount ?? 0} isChecking={isBreachChecking} error={breachError} />
              <DuplicatePasswordWarning
                duplicateCount={duplicateCount}
                duplicates={duplicates}
                isChecking={isDuplicateChecking}
                error={duplicateError}
              />
            </>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="flex items-center gap-2"><MailIcon className="w-4 h-4 text-zinc-500" /> Email</span>
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="e.g., user@example.com"
          className="as-input w-full"
        />
      </div>

      {/* Recovery Codes */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="flex items-center gap-2"><ShieldIcon className="w-4 h-4 text-zinc-500" /> Recovery Codes</span>
        </label>
        <textarea
          value={data.recovery_codes}
          onChange={(e) => onChange({ ...data, recovery_codes: e.target.value })}
          placeholder="Paste recovery codes (space-separated)"
          rows={3}
          className="as-input w-full resize-none font-mono text-sm"
        />
      </div>

      {/* Document */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="flex items-center gap-2"><DocumentIcon className="w-4 h-4 text-zinc-500" /> Document</span>
        </label>
        <input
          type="file"
          onChange={onFileChange}
          className="as-input w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:cursor-pointer cursor-pointer"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="flex items-center gap-2"><NotesIcon className="w-4 h-4 text-zinc-500" /> Notes</span>
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Additional information..."
          rows={4}
          className="as-input w-full resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="as-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="as-btn-primary flex-1">{editingProfile ? 'Save Changes' : 'Add Credential'}</button>
      </div>
    </form>
  );
};

export default ProfileManager;
