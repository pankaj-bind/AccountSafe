import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../services/authService';
import { getPinStatus } from '../services/pinService';
import { useAuth } from '../contexts/AuthContext';
import PinSetupModal from '../components/PinSetupModal';

// Icons
const UserIcon = () => (
    <svg className="w-5 h-5 text-win-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-5 h-5 text-win-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const ShieldIcon = () => (
    <img
        src={process.env.REACT_APP_LOGO_URL || '/account-safe-logo.png'}
        alt="logo"
        className="w-20 h-20"
    />
);

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const navigate = useNavigate();
    const { setToken } = useAuth();
    const location = useLocation();
    const message = location.state?.message;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const data = await login(username, password);
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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-win-bg-solid">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <ShieldIcon />
                    </div>
                    <h1 className="text-2xl font-semibold text-win-text-primary">Welcome back</h1>
                    <p className="mt-2 text-sm text-win-text-secondary">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="win-card p-8">
                    {message && (
                        <div className="mb-6 p-3 rounded-win bg-green-500/10 border border-green-500/30 text-green-500 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {message}
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-6 p-3 rounded-win bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-win-text-secondary mb-2">
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
                                    className="win-input pl-10"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-win-text-secondary">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-sm text-win-accent hover:underline transition-colors">
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
                                    className="win-input pl-10"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full win-btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

                    <div className="mt-6 pt-6 border-t border-win-border-default text-center">
                        <p className="text-sm text-win-text-secondary">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-win-accent hover:underline font-medium transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
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
