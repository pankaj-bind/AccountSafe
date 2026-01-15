// src/pages/ForgotPasswordPage.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestPasswordResetOTP, verifyPasswordResetOTP, setNewPasswordWithOTP } from '../services/authService';

// Cloudflare Turnstile
declare global {
    interface Window {
        turnstile: any;
    }
}

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

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
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
  const [isResending, setIsResending] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Timer states
  const [otpExpiryTime, setOtpExpiryTime] = useState<number>(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  
  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // OTP expiry countdown timer
  useEffect(() => {
    if (step !== 'otp' || otpExpiryTime <= 0) return;
    
    const timer = setInterval(() => {
      setOtpExpiryTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('Verification code has expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [step, otpExpiryTime]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // Load Cloudflare Turnstile script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Render Turnstile widget
  useEffect(() => {
    if (!turnstileRef.current || step !== 'email') return;

    const renderWidget = () => {
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY || '',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'error-callback': () => {
            setTurnstileToken(null);
          },
          theme: 'light',
          size: 'normal',
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestPasswordResetOTP(email, turnstileToken);
      setMessage('A verification code has been sent to your email.');
      setOtpExpiryTime(response.expires_in || 300);
      setResendCooldown(60); // 60 second cooldown for resend
      setRemainingAttempts(null);
      setStep('otp');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (err.response?.status === 429) {
        // Rate limited
        setError(errorData?.error || 'Please wait before requesting another code.');
        setResendCooldown(errorData?.retry_after || 60);
      } else if (err.response?.status === 404) {
        setError(errorData?.error || 'No account found with this email address.');
      } else {
        setError(errorData?.error || errorData?.email?.[0] || 'Failed to send verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setError(null);
    setMessage(null);
    setIsResending(true);
    
    try {
      const response = await requestPasswordResetOTP(email);
      setMessage('A new verification code has been sent to your email.');
      setOtpExpiryTime(response.expires_in || 300);
      setResendCooldown(60);
      setOtp(''); // Clear old OTP
      setRemainingAttempts(null);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (err.response?.status === 429) {
        setError(errorData?.error || 'Please wait before requesting another code.');
        setResendCooldown(errorData?.retry_after || 60);
      } else {
        setError(errorData?.error || 'Failed to resend code. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const response = await verifyPasswordResetOTP(email, otp);
      setMessage('Code verified! You can now set a new password.');
      setStep('password');
    } catch (err: any) {
      const errorData = err.response?.data;
      
      // Update remaining attempts if provided
      if (errorData?.remaining_attempts !== undefined) {
        setRemainingAttempts(errorData.remaining_attempts);
      }
      
      // Handle specific error codes
      switch (errorData?.code) {
        case 'OTP_EXPIRED':
          setError('Verification code has expired. Please request a new one.');
          setOtpExpiryTime(0);
          break;
        case 'MAX_ATTEMPTS_EXCEEDED':
          setError('Too many failed attempts. Please request a new verification code.');
          setOtpExpiryTime(0);
          break;
        case 'OTP_NOT_FOUND':
          setError('No verification code found. Please request a new one.');
          break;
        case 'OTP_ALREADY_USED':
          setError('This code has already been used. Please request a new one.');
          break;
        default:
          setError(errorData?.error || 'Invalid verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
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
      const errorData = err.response?.data;
      
      // Handle specific error codes
      switch (errorData?.code) {
        case 'OTP_EXPIRED':
          setError('Session expired. Please start the password reset process again.');
          break;
        case 'MAX_ATTEMPTS_EXCEEDED':
          setError('Too many failed attempts. Please start over.');
          break;
        default:
          setError(errorData?.error || errorData?.password?.[0] || 'Failed to reset password. Please try again.');
      }
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
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            {requirements.map(req => (
                <span 
                    key={req.text} 
                    className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                        req.valid 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700'
                    }`}
                >
                    {req.valid ? <CheckIcon /> : <XIcon />}
                    <span className="whitespace-nowrap">{req.text}</span>
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
    <div className="min-h-screen bg-white dark:bg-[#09090b] flex items-center justify-center px-4 py-8 sm:p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="as-card p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <KeyIcon />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Reset Password</h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {step === 'email' && 'Enter your email to receive a reset code'}
              {step === 'otp' && 'Enter the 6-digit code sent to your email'}
              {step === 'password' && 'Create your new password'}
              {step === 'success' && 'Password reset successful!'}
            </p>
          </div>

          {/* Step Indicators */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-5 sm:mb-6">
              {stepIndicators.map((s, i) => (
                <React.Fragment key={s.step}>
                  <div className={`flex items-center gap-1 sm:gap-1.5 ${
                    step === s.step ? 'text-blue-500 dark:text-blue-400' : 
                    stepIndicators.findIndex(x => x.step === step) > i ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step === s.step ? 'bg-blue-500 text-white' : 
                      stepIndicators.findIndex(x => x.step === step) > i ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
                    }`}>
                      {stepIndicators.findIndex(x => x.step === step) > i ? <CheckIcon /> : i + 1}
                    </div>
                    <span className="text-[10px] sm:text-xs hidden sm:inline">{s.label}</span>
                  </div>
                  {i < stepIndicators.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 ${
                      stepIndicators.findIndex(x => x.step === step) > i ? 'bg-green-500 dark:bg-green-400' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Feedback Messages */}
          {message && (
            <div className="as-alert-success mb-4">
              <CheckIcon />
              {message}
            </div>
          )}
          {error && (
            <div className="as-alert-danger mb-4">
              <XIcon />
              {error}
            </div>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500">
                    <EmailIcon />
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="as-input pl-10" 
                    placeholder="Enter your email"
                    required 
                  />
                </div>
              </div>
              
              {/* Cloudflare Turnstile */}
              <div className="flex justify-center py-3">
                <div ref={turnstileRef} className="transform scale-95 sm:scale-100"></div>
              </div>

              <button type="submit" disabled={isLoading || !turnstileToken} className="w-full as-btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {/* OTP Expiry Timer */}
              <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${
                otpExpiryTime > 60 ? 'bg-blue-500/10 text-blue-400' : 
                otpExpiryTime > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
              }`}>
                <ClockIcon />
                <span className="text-sm font-medium">
                  {otpExpiryTime > 0 
                    ? `Code expires in ${formatTime(otpExpiryTime)}`
                    : 'Code expired - request a new one'
                  }
                </span>
              </div>
              
              <div>
                <label htmlFor="otp" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500">
                    <KeyIcon />
                  </div>
                  <input 
                    type="text" 
                    id="otp" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    className="as-input pl-10 tracking-[0.5em] font-mono text-center text-lg" 
                    maxLength={6} 
                    placeholder="000000"
                    required 
                    disabled={otpExpiryTime === 0}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-zinc-600 dark:text-zinc-500">Code sent to {email}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-xs text-yellow-400">{remainingAttempts} attempt(s) left</p>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || otpExpiryTime === 0 || otp.length !== 6} 
                className="w-full as-btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : 'Verify Code'}
              </button>
              
              {/* Resend OTP Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isResending}
                  className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                    resendCooldown > 0 || isResending
                      ? 'text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                      : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                  }`}
                >
                  <RefreshIcon />
                  {isResending ? (
                    'Sending...'
                  ) : resendCooldown > 0 ? (
                    `Resend code in ${resendCooldown}s`
                  ) : (
                    "Didn't receive the code? Resend"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500">
                    <LockIcon />
                  </div>
                  <input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="as-input pl-10" 
                    placeholder="Create new password"
                    required 
                  />
                </div>
                {renderPasswordFeedback()}
              </div>
              <div>
                <label htmlFor="password2" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500">
                    <LockIcon />
                  </div>
                  <input 
                    type="password" 
                    id="password2" 
                    value={password2} 
                    onChange={(e) => setPassword2(e.target.value)} 
                    className="as-input pl-10" 
                    placeholder="Confirm new password"
                    required 
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading || passwordErrors.length > 0} className="w-full as-btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Redirecting to login...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <Link to="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
