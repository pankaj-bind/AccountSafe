import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../api/apiClient';
import { generatePassword, getPasswordStrength } from '../utils/passwordGenerator';
import { maskSensitiveData } from '../utils/formatters';

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

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const NotesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const PencilIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
}

interface Profile {
  id: number;
  title: string;
  username: string | null;
  password?: string;
  email: string | null;
  recovery_codes: string | null;
  document: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

interface ProfileManagerProps {
  organization: Organization;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Credential Field Component
// ═══════════════════════════════════════════════════════════════════════════════

interface CredentialFieldProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isCopied: boolean;
  onCopy: () => void;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  mono?: boolean;
  isSensitive?: boolean;
  showSensitive?: boolean;
  onToggleSensitive?: () => void;
}

const CredentialField: React.FC<CredentialFieldProps> = ({
  label,
  value,
  icon,
  isCopied,
  onCopy,
  isPassword = false,
  showPassword = false,
  onTogglePassword,
  mono = false,
  isSensitive = false,
  showSensitive = true,
  onToggleSensitive
}) => {
  // Determine what to display
  const getDisplayValue = () => {
    if (isPassword && !showPassword) return '••••••••••••';
    if (isSensitive && !showSensitive) return maskSensitiveData(value, { type: 'username' });
    return value;
  };

  return (
    <motion.div 
      className="group/field"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</span>
        {isSensitive && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Sensitive
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex-1 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 flex items-center gap-2 min-h-[42px] ${mono ? 'font-mono' : ''}`}>
          <span className={`flex-1 text-sm text-zinc-700 dark:text-zinc-200 break-all transition-all ${(isPassword && !showPassword) || (isSensitive && !showSensitive) ? 'tracking-wider' : ''}`}>
            {getDisplayValue()}
          </span>
          {(isPassword || isSensitive) && (onTogglePassword || onToggleSensitive) && (
            <button
              onClick={isPassword ? onTogglePassword : onToggleSensitive}
              className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              title={(isPassword ? showPassword : showSensitive) ? 'Hide' : 'Show'}
              aria-label={(isPassword ? showPassword : showSensitive) ? 'Hide value' : 'Show value'}
            >
              {(isPassword ? showPassword : showSensitive) ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCopy}
          className={`p-2.5 rounded-lg transition-all ${
            isCopied
              ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700'
          }`}
          title={isCopied ? 'Copied!' : 'Copy'}
          aria-label={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Profile Card Component
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileCardProps {
  profile: Profile;
  recoveryCodes: string[];
  showPassword: boolean;
  expandedNotes: boolean;
  copiedField: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: (text: string, field: string) => void;
  onTogglePassword: () => void;
  onToggleNotes: () => void;
  onCopyRecoveryCode: (code: string, index: number) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  recoveryCodes,
  showPassword,
  expandedNotes,
  copiedField,
  onEdit,
  onDelete,
  onCopy,
  onTogglePassword,
  onToggleNotes,
  onCopyRecoveryCode
}) => {
  const hasCredentials = profile.username || profile.password || profile.email;
  
  return (
    <div className="as-card p-0 overflow-hidden group hover:border-zinc-400 dark:hover:border-zinc-700 transition-all">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
              <KeyIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                {profile.title || 'Untitled Profile'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <ClockIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 text-zinc-400 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Edit"
            >
              <PencilIcon />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-zinc-400 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-5 space-y-4">
        {/* Credentials */}
        {hasCredentials && (
          <div className="space-y-3">
            {profile.username && (
              <CredentialField
                label="Username"
                value={profile.username}
                icon={<UserIcon className="w-4 h-4" />}
                isCopied={copiedField === `username-${profile.id}`}
                onCopy={() => onCopy(profile.username!, `username-${profile.id}`)}
              />
            )}
            
            {profile.password && (
              <CredentialField
                label="Password"
                value={profile.password}
                icon={<KeyIcon className="w-4 h-4" />}
                isCopied={copiedField === `password-${profile.id}`}
                onCopy={() => onCopy(profile.password!, `password-${profile.id}`)}
                isPassword
                showPassword={showPassword}
                onTogglePassword={onTogglePassword}
                mono
              />
            )}
            
            {profile.email && (
              <CredentialField
                label="Email"
                value={profile.email}
                icon={<MailIcon className="w-4 h-4" />}
                isCopied={copiedField === `email-${profile.id}`}
                onCopy={() => onCopy(profile.email!, `email-${profile.id}`)}
              />
            )}
          </div>
        )}
        
        {/* Recovery Codes */}
        {recoveryCodes && recoveryCodes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-400 dark:text-zinc-500"><ShieldIcon className="w-4 h-4" /></span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Recovery Codes
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded">
                {recoveryCodes.length} left
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recoveryCodes.map((code, index) => (
                <button
                  key={index}
                  onClick={() => onCopyRecoveryCode(code, index)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    copiedField === `recovery-${profile.id}-${index}`
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30'
                  }`}
                  title="Click to copy & remove"
                >
                  {code}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-2">
              Click a code to copy it. Codes are removed after copying.
            </p>
          </div>
        )}
        
        {/* Document */}
        {profile.document_url && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-400 dark:text-zinc-500"><DocumentIcon className="w-4 h-4" /></span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Document</span>
            </div>
            <a
              href={profile.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
            >
              <DocumentIcon className="w-4 h-4" />
              <span>View Document</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
        
        {/* Notes */}
        {profile.notes && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-400 dark:text-zinc-500"><NotesIcon className="w-4 h-4" /></span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Notes</span>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3">
              <p className={`text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap ${!expandedNotes ? 'line-clamp-3' : ''}`}>
                {profile.notes}
              </p>
              {profile.notes.length > 150 && (
                <button
                  onClick={onToggleNotes}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2 font-medium"
                >
                  {expandedNotes ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!hasCredentials && !profile.notes && !profile.document_url && recoveryCodes.length === 0 && (
          <div className="text-center py-4 text-zinc-400 dark:text-zinc-500 text-sm">
            No credentials or data stored yet
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

const ProfileManager: React.FC<ProfileManagerProps> = ({ organization, onBack }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orgData, setOrgData] = useState<Organization>(organization);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState<{[key: number]: boolean}>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<{[key: number]: string[]}>({});
  const [expandedNotes, setExpandedNotes] = useState<{[key: number]: boolean}>({});
  const [newProfile, setNewProfile] = useState({
    title: '',
    username: '',
    password: '',
    email: '',
    recovery_codes: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchOrganizationData();
    fetchProfiles();
  }, [organization.id]);

  // Initialize recovery codes for each profile
  useEffect(() => {
    const codes: {[key: number]: string[]} = {};
    profiles.forEach(profile => {
      if (profile.recovery_codes) {
        // Split by whitespace and filter out empty strings
        codes[profile.id] = profile.recovery_codes.split(/\s+/).filter(code => code.trim() !== '');
      }
    });
    setRecoveryCodes(codes);
  }, [profiles]);

  const fetchOrganizationData = async () => {
    try {
      const response = await apiClient.get(`organizations/${organization.id}/`);
      setOrgData(response.data);
    } catch (err: any) {
      console.error('Error fetching organization:', err);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`organizations/${organization.id}/profiles/`);
      setProfiles(response.data);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new FormData();
      // Always append fields, even if empty, to allow clearing values
      formData.append('title', newProfile.title || '');
      formData.append('username', newProfile.username || '');
      formData.append('password', newProfile.password || '');
      formData.append('email', newProfile.email || '');
      formData.append('recovery_codes', newProfile.recovery_codes || '');
      formData.append('notes', newProfile.notes || '');
      if (selectedFile) formData.append('document', selectedFile);

      if (editingProfile) {
        const response = await apiClient.put(
          `profiles/${editingProfile.id}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setProfiles(profiles.map(p => p.id === editingProfile.id ? response.data : p));
      } else {
        const response = await apiClient.post(
          `organizations/${organization.id}/profiles/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setProfiles([...profiles, response.data]);
      }

      setShowModal(false);
      setEditingProfile(null);
      setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError(editingProfile ? 'Failed to update profile' : 'Failed to create profile');
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!window.confirm('Delete this profile?')) return;

    try {
      await apiClient.delete(`profiles/${profileId}/`);
      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (err: any) {
      setError('Failed to delete profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setNewProfile({
      title: profile.title || '',
      username: profile.username || '',
      password: profile.password || '',
      email: profile.email || '',
      recovery_codes: profile.recovery_codes || '',
      notes: profile.notes || '',
    });
    setShowModal(true);
    setError(null);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      setCopiedField(null);
    });
  };

  const togglePasswordVisibility = (profileId: number) => {
    setShowPassword(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const toggleNotesExpansion = (profileId: number) => {
    setExpandedNotes(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const handleCopyRecoveryCode = async (profileId: number, code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedField(`recovery-${profileId}-${index}`);
      setTimeout(() => setCopiedField(null), 1000);
      
      // Remove the copied code from the list
      setRecoveryCodes(prev => {
        const updated = { ...prev };
        if (updated[profileId]) {
          updated[profileId] = updated[profileId].filter((_, i) => i !== index);
          
          // Update the profile with the new recovery codes
          const updatedCodes = updated[profileId].join(' ');
          updateProfileRecoveryCodes(profileId, updatedCodes);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to copy recovery code:', err);
    }
  };

  const updateProfileRecoveryCodes = async (profileId: number, newCodes: string) => {
    try {
      const formData = new FormData();
      formData.append('recovery_codes', newCodes);
      
      await apiClient.put(`profiles/${profileId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update the profiles list
      setProfiles(profiles.map(p => 
        p.id === profileId ? { ...p, recovery_codes: newCodes } : p
      ));
    } catch (err) {
      console.error('Failed to update recovery codes:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--as-bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Back Button & Header */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Vault</span>
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Organization Logo */}
              {orgData.logo_url ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                  <img
                    src={orgData.logo_url}
                    alt={orgData.name}
                    className="w-full h-full object-contain p-2 bg-white dark:bg-transparent"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold text-2xl">
                    {orgData.name ? orgData.name.charAt(0).toUpperCase() : 'O'}
                  </span>
                </div>
              )}
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  {orgData.name || 'Loading...'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-zinc-400 text-sm">
                    {profiles.length} {profiles.length === 1 ? 'credential' : 'credentials'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Add Profile Button */}
            <button
              onClick={() => { setShowModal(true); setError(null); }}
              className="as-btn-primary flex items-center justify-center gap-2 group"
            >
              <PlusIcon className="w-5 h-5 transition-transform group-hover:rotate-90" />
              <span>Add Credential</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Error Alert */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {error && (
          <div className="as-alert-danger mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Loading State */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-zinc-400">Loading credentials...</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Empty State */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {!loading && profiles.length === 0 && (
          <div className="as-card p-12 text-center">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyIcon className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No credentials yet</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Add your first credential to start storing passwords, emails, and recovery codes securely.
            </p>
            <button
              onClick={() => { setShowModal(true); setError(null); }}
              className="as-btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add First Credential
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Profiles Grid */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                recoveryCodes={recoveryCodes[profile.id] || []}
                showPassword={showPassword[profile.id] || false}
                expandedNotes={expandedNotes[profile.id] || false}
                copiedField={copiedField}
                onEdit={() => handleEditProfile(profile)}
                onDelete={() => handleDeleteProfile(profile.id)}
                onCopy={copyToClipboard}
                onTogglePassword={() => togglePasswordVisibility(profile.id)}
                onToggleNotes={() => toggleNotesExpansion(profile.id)}
                onCopyRecoveryCode={(code, index) => handleCopyRecoveryCode(profile.id, code, index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* Create/Edit Profile Modal */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="as-modal w-full max-w-lg max-h-[90vh] overflow-y-auto animate-[modalIn_0.3s_ease-out]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <KeyIcon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {editingProfile ? 'Edit Credential' : 'Add Credential'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateProfile} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <NotesIcon className="w-4 h-4 text-zinc-500" />
                    Title
                  </span>
                </label>
                <input
                  type="text"
                  value={newProfile.title}
                  onChange={(e) => setNewProfile({ ...newProfile, title: e.target.value })}
                  placeholder="e.g., Admin Account, Personal Login"
                  className="as-input w-full"
                  autoFocus
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                    Username
                  </span>
                </label>
                <input
                  type="text"
                  value={newProfile.username}
                  onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                  placeholder="e.g., john_doe or admin@example.com"
                  className="as-input w-full"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <KeyIcon className="w-4 h-4 text-zinc-500" />
                    Password
                  </span>
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProfile.password}
                      onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                      placeholder="Enter password or generate one"
                      className="as-input flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = generatePassword({
                          length: 16,
                          uppercase: true,
                          lowercase: true,
                          numbers: true,
                          symbols: true
                        });
                        setNewProfile({ ...newProfile, password: pwd });
                      }}
                      className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-all flex items-center gap-2"
                      title="Generate strong password"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">Generate</span>
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newProfile.password && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              getPasswordStrength(newProfile.password).color === 'green' ? 'bg-emerald-500' :
                              getPasswordStrength(newProfile.password).color === 'blue' ? 'bg-blue-500' :
                              getPasswordStrength(newProfile.password).color === 'yellow' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${getPasswordStrength(newProfile.password).score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          getPasswordStrength(newProfile.password).color === 'green' ? 'text-emerald-400' :
                          getPasswordStrength(newProfile.password).color === 'blue' ? 'text-blue-400' :
                          getPasswordStrength(newProfile.password).color === 'yellow' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {getPasswordStrength(newProfile.password).label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {newProfile.password.length >= 12 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">12+ chars</span>
                        )}
                        {/[A-Z]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Uppercase</span>
                        )}
                        {/[a-z]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Lowercase</span>
                        )}
                        {/[0-9]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Numbers</span>
                        )}
                        {/[^a-zA-Z0-9]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Symbols</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Password Suggestions when field is empty */}
                  {!newProfile.password && (
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5">
                        <SparklesIcon className="w-3.5 h-3.5" />
                        Quick suggestions (click to use):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          generatePassword({ length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false }),
                          generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }),
                          generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true })
                        ].map((pwd, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewProfile({ ...newProfile, password: pwd })}
                            className="text-xs font-mono px-2 py-1.5 bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600 rounded text-zinc-300 hover:text-white transition-colors truncate max-w-[150px]"
                            title={pwd}
                          >
                            {pwd.substring(0, 12)}...
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <MailIcon className="w-4 h-4 text-zinc-500" />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  value={newProfile.email}
                  onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                  placeholder="e.g., user@example.com"
                  className="as-input w-full"
                />
              </div>

              {/* Recovery Codes */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-zinc-500" />
                    Recovery Codes
                  </span>
                </label>
                <textarea
                  value={newProfile.recovery_codes}
                  onChange={(e) => setNewProfile({ ...newProfile, recovery_codes: e.target.value })}
                  placeholder="Paste recovery codes (space-separated)"
                  rows={3}
                  className="as-input w-full resize-none font-mono text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Codes will appear as clickable buttons. Clicking copies and removes them.
                </p>
              </div>

              {/* Document */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <DocumentIcon className="w-4 h-4 text-zinc-500" />
                    Document
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="as-input w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:cursor-pointer cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Upload PDFs, images, or other documents
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <NotesIcon className="w-4 h-4 text-zinc-500" />
                    Notes
                  </span>
                </label>
                <textarea
                  value={newProfile.notes}
                  onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })}
                  placeholder="Additional information..."
                  rows={4}
                  className="as-input w-full resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProfile(null);
                    setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
                    setSelectedFile(null);
                  }}
                  className="as-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="as-btn-primary flex-1">
                  {editingProfile ? 'Save Changes' : 'Add Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManager;
