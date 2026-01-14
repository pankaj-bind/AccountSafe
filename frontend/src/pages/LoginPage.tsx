import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../services/authService';
import { getPinStatus } from '../services/pinService';
import { useAuth } from '../contexts/AuthContext';
import PinSetupModal from '../components/PinSetupModal';

// Cloudflare Turnstile
declare global {
    interface Window {
        turnstile: any;
    }
}

// Icons
const UserIcon = () => (
    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const ShieldIcon = () => (
    <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-500/20 overflow-hidden">
        <img src="/logo.png" alt="AccountSafe" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
    </div>
);

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { setToken } = useAuth();
    const location = useLocation();
    const message = location.state?.message;

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
        if (!turnstileRef.current) return;

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
                    theme: 'dark',
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
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!turnstileToken) {
            setError('Please complete the verification challenge.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await login(username, password, turnstileToken);
            setToken(data.key);
            
            // Check if user has PIN set
            try {
                const pinStatus = await getPinStatus();
                if (!pinStatus.has_pin) {
                    setShowPinSetup(true);
                } else {
                    navigate('/', { replace: true });
                }
            } catch {
                // If PIN check fails, just navigate to dashboard
                navigate('/', { replace: true });
            }
        } catch (err) {
            setError('Failed to log in. Please check your username and password.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinSetupSuccess = () => {
        setShowPinSetup(false);
        navigate('/', { replace: true });
    };
    
    return (
        <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-8 sm:py-12 bg-white dark:bg-[#09090b] pt-8 sm:pt-0">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="flex justify-center mb-4 sm:mb-5">
                        <ShieldIcon />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Welcome back</h1>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Sign in to your AccountSafe vault</p>
                </div>

                {/* Card */}
                <div className="as-card p-5 sm:p-8">
                    {message && (
                        <div className="as-alert-success mb-6">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {message}
                        </div>
                    )}
                    
                    {error && (
                        <div className="as-alert-danger mb-6">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="as-input pl-10"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockIcon />
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="as-input pl-10"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Cloudflare Turnstile */}
                        <div className="flex justify-center py-3">
                            <div ref={turnstileRef} className="transform scale-95 sm:scale-100"></div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !turnstileToken}
                            className="w-full as-btn-primary py-3 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign in</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                        <p className="text-sm text-zinc-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
                
                {/* Footer */}
                <p className="mt-6 text-center text-xs text-zinc-600">
                    Protected by end-to-end encryption
                </p>
            </div>

            {/* PIN Setup Modal */}
            <PinSetupModal
                isOpen={showPinSetup}
                onClose={() => {
                    setShowPinSetup(false);
                    navigate('/', { replace: true });
                }}
                onSuccess={handlePinSetupSuccess}
            />
        </div>
    );
};

export default LoginPage;
