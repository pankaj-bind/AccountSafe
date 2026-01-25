import React, { useState, useRef, useEffect } from 'react';
import { setupPin } from '../services/pinService';

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
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
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
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
          <div className="flex justify-center gap-3 mb-6">
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
                className="w-14 h-14 text-center text-2xl font-bold as-input rounded-xl focus:ring-2 focus:ring-blue-500"
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
          <div className="flex gap-3">
            {step === 'confirm' && (
              <button
                onClick={() => {
                  setStep('enter');
                  setConfirmPin(['', '', '', '']);
                  setError(null);
                  setTimeout(() => inputRefs.current[0]?.focus(), 100);
                }}
                className="flex-1 as-btn-secondary"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 'enter' ? handleSubmitPin : handleConfirmPin}
              disabled={isLoading || (step === 'enter' ? pin.join('').length !== 4 : confirmPin.join('').length !== 4)}
              className="flex-1 as-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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
