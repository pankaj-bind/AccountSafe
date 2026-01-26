// src/features/security/components/CanaryTrapManager.tsx
/**
 * Canary Trap Manager Component
 * 
 * Allows users to create, view, and manage "trap credentials" (honeytokens)
 * that trigger alerts when accessed by an attacker.
 * 
 * This is BREACH DETECTION (digital protection), distinct from
 * Duress Mode which is PHYSICAL protection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getCanaryTraps, 
  createCanaryTrap, 
  deleteCanaryTrap,
  getCanaryTrapDetail,
  updateCanaryTrap 
} from '../services/securityService';
import type { CanaryTrap, CanaryTrapType, CanaryTrapTrigger } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const TrapIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zM12 12.75h.007v.008H12v-.008z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const WebhookIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TRAP TYPE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const TRAP_TYPE_CONFIG: Record<CanaryTrapType, { 
  label: string; 
  description: string; 
  icon: React.FC; 
  color: string;
  template: string;
}> = {
  web_login: {
    label: 'Web Login URL',
    description: 'A URL that mimics a login page. Save it as a fake credential in your vault.',
    icon: LinkIcon,
    color: 'blue',
    template: 'Intranet Portal'
  },
  api_key: {
    label: 'API Key',
    description: 'A fake API key. If someone tries to use it, you\'ll be alerted.',
    icon: KeyIcon,
    color: 'purple',
    template: 'AWS Production Key'
  },
  webhook: {
    label: 'Webhook URL',
    description: 'A webhook endpoint that triggers when called.',
    icon: WebhookIcon,
    color: 'emerald',
    template: 'Slack Webhook'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE TRAP MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface CreateTrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (trap: CanaryTrap) => void;
}

const CreateTrapModal: React.FC<CreateTrapModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [trapType, setTrapType] = useState<CanaryTrapType>('web_login');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!label.trim()) {
      setError('Please enter a label for your trap');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const trap = await createCanaryTrap({
        label: label.trim(),
        description: description.trim() || undefined,
        trap_type: trapType
      });
      onCreated(trap);
      onClose();
      setLabel('');
      setDescription('');
      setTrapType('web_login');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to create trap');
    } finally {
      setIsCreating(false);
    }
  };

  const applyTemplate = (type: CanaryTrapType) => {
    setTrapType(type);
    setLabel(TRAP_TYPE_CONFIG[type].template);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="as-modal max-w-lg w-full rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
              <TrapIcon />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Create Security Trap</h3>
              <p className="text-sm text-white/80">Set up a honeytoken for breach detection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 bg-white dark:bg-zinc-950 space-y-5">
          {/* Error */}
          {error && (
            <div className="as-alert-danger flex items-center gap-2">
              <AlertIcon />
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertIcon />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">What is a Security Trap?</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  A trap credential looks real but triggers an alert when accessed. Save the generated URL as a 
                  fake credential in your vault. If an attacker steals your passwords and tries to use it, 
                  you'll be instantly notified.
                </p>
              </div>
            </div>
          </div>

          {/* Trap Type Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Trap Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(TRAP_TYPE_CONFIG) as CanaryTrapType[]).map((type) => {
                const config = TRAP_TYPE_CONFIG[type];
                const Icon = config.icon;
                const isSelected = trapType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => applyTemplate(type)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-500/10` 
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                      isSelected 
                        ? `bg-${config.color}-100 dark:bg-${config.color}-500/20 text-${config.color}-600 dark:text-${config.color}-400` 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      <Icon />
                    </div>
                    <span className={`text-xs font-medium ${
                      isSelected 
                        ? `text-${config.color}-700 dark:text-${config.color}-400` 
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Corporate VPN, AWS Production"
              className="as-input"
              maxLength={100}
            />
            <p className="text-xs text-zinc-500 mt-1">
              This is what you'll see in your trap list. Make it look like a real service.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Notes <span className="text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Where did you place this trap?"
              className="as-input resize-none"
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !label.trim()}
            className="as-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <TrapIcon />
                Create Trap
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRAP DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface TrapDetailModalProps {
  trap: CanaryTrap | null;
  onClose: () => void;
  onDelete: (trapId: number) => void;
  onToggleActive: (trap: CanaryTrap) => void;
}

const TrapDetailModal: React.FC<TrapDetailModalProps> = ({ trap, onClose, onDelete, onToggleActive }) => {
  const [triggers, setTriggers] = useState<CanaryTrapTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (trap) {
      setIsLoading(true);
      getCanaryTrapDetail(trap.id)
        .then((data) => setTriggers(data.triggers))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [trap]);

  const copyToClipboard = async () => {
    if (!trap) return;
    try {
      await navigator.clipboard.writeText(trap.trap_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async () => {
    if (!trap) return;
    setIsDeleting(true);
    try {
      await deleteCanaryTrap(trap.id);
      onDelete(trap.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!trap) return null;

  const config = TRAP_TYPE_CONFIG[trap.trap_type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="as-modal max-w-2xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-${config.color}-500/20`}>
              <Icon />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">{trap.label}</h3>
              <p className="text-sm text-zinc-400">{config.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 bg-white dark:bg-zinc-950 overflow-y-auto flex-1 space-y-6">
          {/* Trap URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Trap URL
            </label>
            <div className="flex gap-2">
              <code className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 font-mono break-all">
                {trap.trap_url}
              </code>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              💡 Tip: Save this URL as the password or login URL for a fake credential in your vault.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${trap.trigger_count > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                {trap.trigger_count}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Times Triggered</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${trap.is_active ? 'text-green-500' : 'text-zinc-400'}`}>
                {trap.is_active ? 'Active' : 'Paused'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Status</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 text-center">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {new Date(trap.created_at).toLocaleDateString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Created</div>
            </div>
          </div>

          {/* Trigger History */}
          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <AlertIcon />
              Trigger History
            </h4>
            {isLoading ? (
              <div className="text-center py-8 text-zinc-500">
                <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : triggers.length === 0 ? (
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-6 text-center">
                <div className="text-green-600 dark:text-green-400 mb-2">
                  <CheckIcon />
                </div>
                <p className="text-green-700 dark:text-green-400 font-medium">No triggers yet</p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Your trap hasn't been accessed. That's good!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {triggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-sm text-red-700 dark:text-red-400">
                          {trigger.ip_address}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                          {trigger.triggered_at_display}
                          {trigger.country && ` • ${trigger.country}`}
                        </div>
                      </div>
                      {trigger.alert_sent && (
                        <span className="text-xs bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                          Alert Sent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-between shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <TrashIcon />
            {isDeleting ? 'Deleting...' : 'Delete Trap'}
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onToggleActive(trap)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                trap.is_active
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  : 'bg-green-500 text-white'
              }`}
            >
              {trap.is_active ? 'Pause Trap' : 'Activate Trap'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="as-btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface CanaryTrapManagerProps {
  className?: string;
}

const CanaryTrapManager: React.FC<CanaryTrapManagerProps> = ({ className = '' }) => {
  const [traps, setTraps] = useState<CanaryTrap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTrap, setSelectedTrap] = useState<CanaryTrap | null>(null);

  const loadTraps = useCallback(async () => {
    try {
      const data = await getCanaryTraps();
      setTraps(data.traps);
      setError(null);
    } catch (err) {
      setError('Failed to load traps');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTraps();
  }, [loadTraps]);

  const handleTrapCreated = (trap: CanaryTrap) => {
    setTraps((prev) => [trap, ...prev]);
  };

  const handleTrapDeleted = (trapId: number) => {
    setTraps((prev) => prev.filter((t) => t.id !== trapId));
  };

  const handleToggleActive = async (trap: CanaryTrap) => {
    try {
      const updated = await updateCanaryTrap(trap.id, { is_active: !trap.is_active });
      setTraps((prev) => prev.map((t) => (t.id === trap.id ? updated : t)));
      if (selectedTrap?.id === trap.id) {
        setSelectedTrap(updated);
      }
    } catch (err) {
      console.error('Failed to update trap:', err);
    }
  };

  const copyToClipboard = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`as-card p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="text-amber-500 dark:text-amber-400">
              <TrapIcon />
            </span>
            Security Traps (Honeytokens)
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Create trap credentials that alert you when accessed by an attacker
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="as-btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon />
          <span className="hidden sm:inline">Create Trap</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-500">Loading traps...</p>
        </div>
      ) : error ? (
        <div className="as-alert-danger flex items-center gap-2">
          <AlertIcon />
          {error}
        </div>
      ) : traps.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
            <TrapIcon />
          </div>
          <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">No Security Traps Yet</h4>
          <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
            Create a trap credential to detect if someone accesses your stolen passwords.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="as-btn-primary mt-4 inline-flex items-center gap-2"
          >
            <PlusIcon />
            Create Your First Trap
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {traps.map((trap) => {
            const config = TRAP_TYPE_CONFIG[trap.trap_type];
            const Icon = config.icon;
            return (
              <div
                key={trap.id}
                onClick={() => setSelectedTrap(trap)}
                className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-500/20 flex items-center justify-center text-${config.color}-600 dark:text-${config.color}-400`}>
                  <Icon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-zinc-900 dark:text-white truncate">
                      {trap.label}
                    </h4>
                    {!trap.is_active && (
                      <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                        Paused
                      </span>
                    )}
                    {trap.trigger_count > 0 && (
                      <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertIcon />
                        {trap.trigger_count} trigger{trap.trigger_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {config.label}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => copyToClipboard(trap.trap_url, e)}
                    className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrap(trap);
                    }}
                    className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    title="View Details"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateTrapModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleTrapCreated}
      />

      <TrapDetailModal
        trap={selectedTrap}
        onClose={() => setSelectedTrap(null)}
        onDelete={handleTrapDeleted}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
};

export default CanaryTrapManager;
