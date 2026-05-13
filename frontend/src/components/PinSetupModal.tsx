import React, { useState, useRef, useEffect } from 'react';
import { setupPin } from '../services/pinService';
import { Lock, AlertCircle, RefreshCcw } from 'lucide-react';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PinSetupModal: React.FC<PinSetupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setStep('enter');
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value.slice(-1);
    
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    // Auto-focus next input
    if (value && index < 3) {
      const refs = isConfirm ? confirmInputRefs : inputRefs;
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
    if (e.key === 'Backspace') {
      const currentPin = isConfirm ? confirmPin : pin;
      const refs = isConfirm ? confirmInputRefs : inputRefs;
      
      if (!currentPin[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmitPin = () => {
    const pinValue = pin.join('');
    if (pinValue.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }
    setError(null);
    setStep('confirm');
    setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
  };

  const handleConfirmPin = async () => {
    const pinValue = pin.join('');
    const confirmValue = confirmPin.join('');

    if (confirmValue.length !== 4) {
      setError('Please confirm your 4-digit PIN');
      return;
    }

    if (pinValue !== confirmValue) {
      setError('PINs do not match. Please try again.');
      setConfirmPin(['', '', '', '']);
      setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await setupPin(pinValue);
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to set PIN');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="as-modal max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 -m-6 mb-6 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Set Up Security PIN</h3>
              <p className="text-blue-100 text-sm">Protect your organizations with a 4-digit PIN</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {error && (
            <div className="as-alert-danger mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <p className="text-center text-zinc-400 mb-6">
            {step === 'enter' 
              ? 'Enter a 4-digit PIN to secure your vault'
              : 'Confirm your PIN'
            }
          </p>

          {/* PIN Input */}
          <div className="flex justify-center gap-3 w-full px-2 mb-6">
            {(step === 'enter' ? pin : confirmPin).map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (step === 'enter') {
                    inputRefs.current[index] = el;
                  } else {
                    confirmInputRefs.current[index] = el;
                  }
                }}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value, step === 'confirm')}
                onKeyDown={(e) => handleKeyDown(index, e, step === 'confirm')}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 transition-all duration-200 disabled:opacity-50"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full transition-colors ${step === 'enter' ? 'bg-blue-500' : 'bg-zinc-700'}`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${step === 'confirm' ? 'bg-blue-500' : 'bg-zinc-700'}`} />
          </div>

          {/* Buttons */}
          <div className={`grid ${step === 'confirm' ? 'grid-cols-2' : 'grid-cols-1'} gap-3 w-full mt-2`}>
            {step === 'confirm' && (
              <button
                onClick={() => {
                  setStep('enter');
                  setConfirmPin(['', '', '', '']);
                  setError(null);
                  setTimeout(() => inputRefs.current[0]?.focus(), 100);
                }}
                className="w-full as-btn-secondary"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 'enter' ? handleSubmitPin : handleConfirmPin}
              disabled={isLoading || (step === 'enter' ? pin.join('').length !== 4 : confirmPin.join('').length !== 4)}
              className="w-full as-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCcw className="animate-spin h-4 w-4" />
                  Setting up...
                </span>
              ) : step === 'enter' ? 'Continue' : 'Confirm PIN'}
            </button>
          </div>

          <p className="text-center text-xs text-zinc-500 mt-4">
            You'll need this PIN to access your organizations
          </p>
        </div>
      </div>
    </div>
  );
};

export default PinSetupModal;
