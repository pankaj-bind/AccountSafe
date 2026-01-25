import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyPin } from '../services/pinService';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const ShieldCheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LockClosedIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════════════════════════

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.15 }
  }
};

const shakeVariants = {
  shake: {
    x: [-12, 12, -12, 12, -8, 8, -4, 4, 0],
    transition: { duration: 0.5 }
  }
};

const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, damping: 15, stiffness: 300 }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════════

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

const PinVerificationModal: React.FC<PinVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  organizationName 
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError(null);
      setIsShaking(false);
      setIsSuccess(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard events globally when modal is open
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) || isLoading || isSuccess) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 3) {
      const fullPin = [...newPin.slice(0, 3), value.slice(-1)].join('');
      if (fullPin.length === 4) {
        handleVerify(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'Enter') {
      const fullPin = pin.join('');
      if (fullPin.length === 4) {
        handleVerify(fullPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData.length === 4) {
      const newPin = pastedData.split('');
      setPin(newPin);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (pinValue?: string) => {
    const pinToVerify = pinValue || pin.join('');
    
    if (pinToVerify.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyPin(pinToVerify);
      setIsSuccess(true);
      
      // Delay success callback for animation
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: unknown) {
      setAttempts(prev => prev + 1);
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Incorrect PIN');
      setIsShaking(true);
      setPin(['', '', '', '']);
      
      setTimeout(() => {
        setIsShaking(false);
        inputRefs.current[0]?.focus();
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const getRemainingAttempts = () => {
    const maxAttempts = 5;
    const remaining = maxAttempts - attempts;
    if (remaining <= 2 && remaining > 0) {
      return `${remaining} attempt${remaining === 1 ? '' : 's'} remaining`;
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="as-modal max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success State */}
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 flex flex-col items-center justify-center min-h-[320px]"
                >
                  <motion.div
                    variants={successVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/25"
                  >
                    <CheckIcon className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-semibold text-zinc-900 dark:text-white"
                  >
                    Access Granted
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-zinc-500 dark:text-zinc-400 mt-1"
                  >
                    {organizationName ? `Opening ${organizationName}...` : 'Redirecting...'}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div key="form">
                  {/* Header */}
                  <div className="flex items-center justify-center gap-3 p-6 pb-2">
                    <motion.div 
                      className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/20"
                      whileHover={{ scale: 1.05 }}
                    >
                      {error ? (
                        <LockClosedIcon className="w-6 h-6 text-red-400" />
                      ) : (
                        <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
                      )}
                    </motion.div>
                  </div>

                  {/* Title */}
                  <div className="text-center px-6">
                    <h3 
                      id="pin-modal-title" 
                      className="text-xl font-semibold text-zinc-900 dark:text-white"
                    >
                      Enter PIN
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {organizationName 
                        ? `Unlock to view ${organizationName}` 
                        : 'Verify your identity to continue'
                      }
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Error Alert */}
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                            {getRemainingAttempts() && (
                              <span className="ml-auto text-xs opacity-75">
                                {getRemainingAttempts()}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* PIN Input with Shake Animation */}
                    <motion.div
                      animate={isShaking ? 'shake' : ''}
                      variants={shakeVariants}
                      className="flex justify-center gap-3"
                      onPaste={handlePaste}
                    >
                      {pin.map((digit, index) => (
                        <motion.div
                          key={index}
                          className="relative"
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={isLoading || isSuccess}
                            aria-label={`PIN digit ${index + 1}`}
                            className={`
                              w-14 h-14 text-center text-2xl font-bold rounded-xl
                              transition-all duration-200 outline-none
                              ${error 
                                ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-500/10' 
                                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                              }
                              border-2
                              focus:border-blue-500 dark:focus:border-blue-400
                              focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20
                              text-zinc-900 dark:text-white
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          />
                          {/* Filled dot indicator */}
                          <AnimatePresence>
                            {digit && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                              >
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 as-btn-secondary"
                        aria-label="Cancel PIN verification"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleVerify()}
                        disabled={isLoading || pin.join('').length !== 4}
                        className="flex-1 as-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Verify PIN"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.svg
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </motion.svg>
                            Verifying
                          </span>
                        ) : 'Verify'}
                      </motion.button>
                    </div>

                    {/* Help Text */}
                    <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                      Forgot your PIN? Reset it from{' '}
                      <button 
                        onClick={onClose}
                        className="text-blue-500 hover:text-blue-400 hover:underline transition-colors"
                      >
                        Profile Settings
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PinVerificationModal;
