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
import { 
  ShieldAlert, 
  Plus, 
  Copy, 
  Trash2, 
  AlertTriangle, 
  Link as LinkIcon, 
  Key, 
  Globe, 
  Check, 
  X, 
  Eye,
  Lightbulb,
  AlertCircle
} from 'lucide-react';

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
    icon: Key,
    color: 'purple',
    template: 'AWS Production Key'
  },
  webhook: {
    label: 'Webhook URL',
    description: 'A webhook endpoint that triggers when called.',
    icon: Globe,
    color: 'emerald',
    template: 'Slack Webhook'
  }
};

// Icon components
const AlertIcon = ({ className = "w-5 h-5" }: { className?: string }) => <AlertCircle className={className} />;
const TrapIcon = ({ className = "w-10 h-10" }: { className?: string }) => <ShieldAlert className={className} />;

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
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Create Security Trap</h3>
              <p className="text-sm text-white/80">Set up a honeytoken for breach detection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
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
                <AlertTriangle className="w-5 h-5" />
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
                <ShieldAlert className="w-4 h-4" />
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
            <X className="w-5 h-5" />
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
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs text-zinc-500">
                Tip: Save this URL as the password or login URL for a fake credential in your vault.
              </p>
            </div>
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
              <AlertTriangle className="w-5 h-5 text-amber-500" />
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
                  <Check className="w-5 h-5 mx-auto" />
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
            <Trash2 className="w-4 h-4" />
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
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="text-amber-500 dark:text-amber-400 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </span>
            Security Traps (Honeytokens)
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Create trap credentials that alert you when accessed by an attacker
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="as-btn-primary inline-flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
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
            <Plus className="w-5 h-5" />
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
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all group"
              >
                <div className={`w-10 h-10 flex-shrink-0 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-500/20 flex items-center justify-center text-${config.color}-600 dark:text-${config.color}-400`}>
                  <Icon />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-zinc-900 dark:text-white truncate max-w-[150px] sm:max-w-none">
                      {trap.label}
                    </h4>
                    {!trap.is_active && (
                      <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full flex-shrink-0">
                        Paused
                      </span>
                    )}
                    {trap.trigger_count > 0 && (
                      <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {trap.trigger_count} trigger{trap.trigger_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {config.label}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => copyToClipboard(trap.trap_url, e)}
                    className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrap(trap);
                    }}
                    className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
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
