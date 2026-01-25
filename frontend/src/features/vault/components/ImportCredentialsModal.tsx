// src/features/vault/components/ImportCredentialsModal.tsx
/**
 * Import Credentials Modal - Smart Zero-Knowledge CSV Import
 * 
 * A beautiful, step-by-step import wizard that:
 * 1. Accepts drag-and-drop CSV files
 * 2. Shows progress through parsing, enriching, encrypting, and uploading
 * 3. Displays a summary of imported credentials
 * 
 * SECURITY: All encryption happens client-side. Server NEVER sees plaintext.
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useSmartImport, type ImportPhase } from '../hooks/useSmartImport';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ImportCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

const STEPS: { phase: ImportPhase; label: string }[] = [
  { phase: 'PARSING', label: 'Reading' },
  { phase: 'GROUPING', label: 'Grouping' },
  { phase: 'ENRICHING', label: 'Enriching' },
  { phase: 'ENCRYPTING', label: 'Encrypting' },
  { phase: 'UPLOADING', label: 'Saving' },
];

function getStepStatus(currentPhase: ImportPhase, stepPhase: ImportPhase): 'pending' | 'active' | 'complete' {
  const phaseOrder = ['IDLE', 'PARSING', 'GROUPING', 'ENRICHING', 'ENCRYPTING', 'UPLOADING', 'DONE'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const stepIndex = phaseOrder.indexOf(stepPhase);
  
  if (currentPhase === 'DONE') return 'complete';
  if (currentPhase === 'ERROR') {
    if (stepIndex < currentIndex) return 'complete';
    return 'pending';
  }
  
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

interface StepIndicatorProps {
  phase: ImportPhase;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ phase }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const status = getStepStatus(phase, step.phase);
        
        return (
          <React.Fragment key={step.phase}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${status === 'complete' ? 'bg-green-500 text-white' : ''}
                  ${status === 'active' ? 'bg-blue-500 text-white ring-4 ring-blue-500/30' : ''}
                  ${status === 'pending' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400' : ''}
                `}
              >
                {status === 'complete' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`
                text-xs mt-2 font-medium transition-colors
                ${status === 'active' ? 'text-blue-500' : ''}
                ${status === 'complete' ? 'text-green-500' : ''}
                ${status === 'pending' ? 'text-zinc-400' : ''}
              `}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2 transition-colors duration-300
                ${getStepStatus(phase, STEPS[index + 1].phase) !== 'pending' ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ImportCredentialsModal: React.FC<ImportCredentialsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const {
    phase,
    progress,
    progressMessage,
    error,
    organizations,
    result,
    startImport,
    reset,
    cancel,
  } = useSmartImport();
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        reset();
        setSelectedFile(null);
        setIsDragOver(false);
      }, 300);
    }
  }, [isOpen, reset]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        setSelectedFile(file);
      }
    }
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);
  
  const handleStartImport = useCallback(() => {
    if (selectedFile) {
      startImport(selectedFile);
    }
  }, [selectedFile, startImport]);
  
  const handleClose = useCallback(() => {
    if (phase !== 'IDLE' && phase !== 'DONE' && phase !== 'ERROR') {
      cancel();
    }
    onClose();
  }, [phase, cancel, onClose]);
  
  const handleComplete = useCallback(() => {
    onImportComplete?.();
    onClose();
  }, [onImportComplete, onClose]);
  
  if (!isOpen) return null;
  
  const isProcessing = !['IDLE', 'DONE', 'ERROR'].includes(phase);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="as-modal max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
              <DocumentIcon />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Import Credentials</h3>
              <p className="text-sm text-white/80">From Chrome, Edge, or Firefox export</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 bg-white dark:bg-zinc-950">
          {/* Zero-Knowledge Notice */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-green-600 dark:text-green-400 mt-0.5">
                <ShieldCheckIcon />
              </span>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm">
                  Zero-Knowledge Import
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Your CSV is processed locally in your browser. Passwords are encrypted before leaving your device. 
                  Our servers <strong>never</strong> see your plaintext credentials.
                </p>
              </div>
            </div>
          </div>
          
          {/* Phase: IDLE - File Upload */}
          {phase === 'IDLE' && (
            <>
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${isDragOver 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                    : selectedFile
                      ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-4">
                      <CheckCircleIcon />
                    </div>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`text-zinc-400 dark:text-zinc-500 mb-4 transition-colors ${isDragOver ? 'text-blue-500' : ''}`}>
                      <UploadIcon />
                    </div>
                    <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                      {isDragOver ? 'Drop your CSV here' : 'Drag & drop your password CSV'}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      or click to browse
                    </p>
                    <p className="text-xs text-zinc-400 mt-4">
                      Supports Chrome, Edge, Firefox, and Bitwarden exports
                    </p>
                  </div>
                )}
              </div>
              
              {/* How to Export Guide */}
              <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm mb-3">
                  How to export from your browser:
                </h4>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">Chrome:</span>
                    Settings → Passwords → ⋮ → Export passwords
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">Edge:</span>
                    Settings → Passwords → ⋯ → Export passwords
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">Firefox:</span>
                    Settings → Logins → ⋮ → Export Logins
                  </li>
                </ul>
              </div>
            </>
          )}
          
          {/* Phase: Processing */}
          {isProcessing && (
            <>
              <StepIndicator phase={phase} />
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-600 dark:text-zinc-400">{progressMessage}</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{progress}%</span>
                </div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* Organization Preview */}
              {organizations.length > 0 && phase !== 'PARSING' && (
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm mb-3">
                    Organizations to import ({organizations.length})
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {organizations.slice(0, 20).map((org, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700"
                      >
                        {org.logo_url && (
                          <img 
                            src={org.logo_url} 
                            alt=""
                            className="w-4 h-4 rounded"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {org.name}
                        </span>
                        <span className="text-xs text-zinc-400">
                          ({org.profiles.length})
                        </span>
                      </div>
                    ))}
                    {organizations.length > 20 && (
                      <div className="px-3 py-1.5 text-sm text-zinc-500">
                        +{organizations.length - 20} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Cancel Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={cancel}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Cancel Import
                </button>
              </div>
            </>
          )}
          
          {/* Phase: DONE */}
          {phase === 'DONE' && result && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Import Complete!
              </h4>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Your credentials have been securely imported
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
                  <p className="text-3xl font-bold text-blue-500">{result.profilesImported}</p>
                  <p className="text-sm text-zinc-500">Credentials</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
                  <p className="text-3xl font-bold text-green-500">{result.organizationsCreated}</p>
                  <p className="text-sm text-zinc-500">New Organizations</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
                  <p className="text-3xl font-bold text-purple-500">{result.organizationsReused}</p>
                  <p className="text-sm text-zinc-500">Existing</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
                  <p className="text-3xl font-bold text-amber-500">{result.duplicatesSkipped}</p>
                  <p className="text-sm text-zinc-500">Duplicates Skipped</p>
                </div>
              </div>
              
              {result.errors.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-left">
                  <h5 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2">
                    Some items couldn't be imported:
                  </h5>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={handleComplete}
                className="w-full as-btn-primary py-3"
              >
                Done
              </button>
            </div>
          )}
          
          {/* Phase: ERROR */}
          {phase === 'ERROR' && error && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircleIcon />
              </div>
              
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Import Failed
              </h4>
              <p className="text-red-600 dark:text-red-400 mb-6">
                {error}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 as-btn-secondary"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 as-btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer - Only show in IDLE state */}
        {phase === 'IDLE' && (
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="as-btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleStartImport}
              disabled={!selectedFile}
              className="as-btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Start Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCredentialsModal;
