import React, { useState, useRef, useEffect } from 'react';
import { verifyPin } from '../services/pinService';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationName?: string;
}

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

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
      onSuccess();
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      setError(err.response?.data?.error || 'Invalid PIN');
      setPin(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="as-modal max-w-md w-full animate-[modalIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-300 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Enter PIN</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {organizationName ? `Opening ${organizationName}` : 'Verify your identity'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 space-y-5">
          {error && (
            <div className="as-alert-danger">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
              {attempts >= 3 && (
                <span className="ml-1">({attempts} attempts)</span>
              )}
            </div>
          )}

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Enter your 4-digit security PIN
          </p>

          {/* PIN Input */}
          <div className="flex justify-center gap-3">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-2xl font-bold as-input rounded-xl focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 as-btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => handleVerify()}
              disabled={isLoading || pin.join('').length !== 4}
              className="flex-1 as-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify'}
            </button>
          </div>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
            Forgot your PIN? Reset it from your Profile page
          </p>
        </div>
      </div>
    </div>
  );
};

export default PinVerificationModal;
