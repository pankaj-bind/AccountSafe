// src/pages/ForgotPasswordPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestPasswordResetOTP, verifyPasswordResetOTP, setNewPasswordWithOTP } from '../services/authService';

// Icons
const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

type Step = 'email' | 'otp' | 'password' | 'success';

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  const navigate = useNavigate();

  // Live password validation
  useEffect(() => {
    if (step !== 'password') return;
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
    if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
    if (!/[0-9]/.test(password)) errors.push("At least one number");
    if (!/[\W_]/.test(password)) errors.push("At least one special character");
    setPasswordErrors(errors);
  }, [password, step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await requestPasswordResetOTP(email);
      setMessage('An OTP has been sent to your email.');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || 'Failed to send OTP. Please check the email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await verifyPasswordResetOTP(email, otp);
      setMessage('OTP verified. You can now set a new password.');
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    if (passwordErrors.length > 0) {
      setError('Please fix the errors in your password.');
      return;
    }
    setIsLoading(true);
    try {
      await setNewPasswordWithOTP(email, otp, password);
      setMessage('Your password has been reset successfully!');
      setStep('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.password?.[0] || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderPasswordFeedback = () => {
    if (!password) return null;
    const requirements = [
        { text: "At least 8 characters", valid: password.length >= 8 },
        { text: "One lowercase letter", valid: /[a-z]/.test(password) },
        { text: "One uppercase letter", valid: /[A-Z]/.test(password) },
        { text: "One number", valid: /[0-9]/.test(password) },
        { text: "One special character", valid: /[\W_]/.test(password) },
    ];
    return (
        <div className="mt-3 flex flex-wrap gap-2">
            {requirements.map(req => (
                <span 
                    key={req.text} 
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        req.valid 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-win-bg-subtle text-win-text-tertiary border border-win-border-subtle'
                    }`}
                >
                    {req.valid ? <CheckIcon /> : <XIcon />}
                    {req.text}
                </span>
            ))}
        </div>
    );
  };

  const stepIndicators = [
    { step: 'email', label: 'Email' },
    { step: 'otp', label: 'Verify' },
    { step: 'password', label: 'Reset' },
  ];

  return (
    <div className="min-h-screen bg-win-bg-solid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="win-card p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-win-accent/10 flex items-center justify-center">
              <KeyIcon />
            </div>
            <h1 className="text-xl font-semibold text-win-text-primary">Reset Password</h1>
            <p className="text-sm text-win-text-tertiary mt-1">
              {step === 'email' && 'Enter your email to receive a reset code'}
              {step === 'otp' && 'Enter the 6-digit code sent to your email'}
              {step === 'password' && 'Create your new password'}
              {step === 'success' && 'Password reset successful!'}
            </p>
          </div>

          {/* Step Indicators */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {stepIndicators.map((s, i) => (
                <React.Fragment key={s.step}>
                  <div className={`flex items-center gap-1.5 ${
                    step === s.step ? 'text-win-accent' : 
                    stepIndicators.findIndex(x => x.step === step) > i ? 'text-green-400' : 'text-win-text-tertiary'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step === s.step ? 'bg-win-accent text-black' : 
                      stepIndicators.findIndex(x => x.step === step) > i ? 'bg-green-500/20 text-green-400' : 'bg-win-bg-subtle'
                    }`}>
                      {stepIndicators.findIndex(x => x.step === step) > i ? <CheckIcon /> : i + 1}
                    </div>
                    <span className="text-xs">{s.label}</span>
                  </div>
                  {i < stepIndicators.length - 1 && (
                    <div className={`w-8 h-0.5 ${
                      stepIndicators.findIndex(x => x.step === step) > i ? 'bg-green-400' : 'bg-win-border-subtle'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Feedback Messages */}
          {message && (
            <div className="mb-4 p-3 rounded-win bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
              <CheckIcon />
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-win bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <XIcon />
              {error}
            </div>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-win-text-secondary mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-win-text-tertiary">
                    <EmailIcon />
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="win-input pl-10" 
                    placeholder="Enter your email"
                    required 
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full win-btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-xs font-medium text-win-text-secondary mb-1.5">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-win-text-tertiary">
                    <KeyIcon />
                  </div>
                  <input 
                    type="text" 
                    id="otp" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    className="win-input pl-10 tracking-[0.5em] font-mono text-center" 
                    maxLength={6} 
                    placeholder="000000"
                    required 
                  />
                </div>
                <p className="text-xs text-win-text-tertiary mt-1.5">Code sent to {email}</p>
              </div>
              <button type="submit" disabled={isLoading} className="w-full win-btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : 'Verify Code'}
              </button>
            </form>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-win-text-secondary mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-win-text-tertiary">
                    <LockIcon />
                  </div>
                  <input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="win-input pl-10" 
                    placeholder="Create new password"
                    required 
                  />
                </div>
                {renderPasswordFeedback()}
              </div>
              <div>
                <label htmlFor="password2" className="block text-xs font-medium text-win-text-secondary mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-win-text-tertiary">
                    <LockIcon />
                  </div>
                  <input 
                    type="password" 
                    id="password2" 
                    value={password2} 
                    onChange={(e) => setPassword2(e.target.value)} 
                    className="win-input pl-10" 
                    placeholder="Confirm new password"
                    required 
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading || passwordErrors.length > 0} className="w-full win-btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-win-text-secondary mb-4">Redirecting to login...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-win-border-subtle text-center">
            <Link to="/login" className="text-sm text-win-accent hover:text-win-accent-light transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
