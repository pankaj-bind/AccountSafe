// src/pages/RegisterPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login, checkUsername } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

// Icons
const UserIcon = () => (
    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const EmailIcon = () => (
    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

const CheckIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const XIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');

    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { setToken } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!username) {
            setIsUsernameAvailable(null);
            return;
        }
        setIsCheckingUsername(true);
        const timerId = setTimeout(() => {
            checkUsername(username).then(data => {
                setIsUsernameAvailable(!data.exists);
                setIsCheckingUsername(false);
            });
        }, 500);
        return () => clearTimeout(timerId);
    }, [username]);

    useEffect(() => {
        const errors: string[] = [];
        if (password.length < 8) errors.push("At least 8 characters");
        if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
        if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
        if (!/[0-9]/.test(password)) errors.push("At least one number");
        if (!/[\W_]/.test(password)) errors.push("At least one special character");
        setPasswordErrors(errors);
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (password !== password2) {
            setError('Passwords do not match');
            return;
        }
        if (passwordErrors.length > 0) {
            setError('Please fix the errors in your password.');
            return;
        }
        if (isUsernameAvailable === false) {
            setError('This username is already taken.');
            return;
        }

        setIsLoading(true);
        try {
            await register(username, email, password, password2);
            setSuccess('Account created successfully!');
            
            const loginResponse = await login(username, password);
            const authToken = loginResponse.key || loginResponse.token;
            if (authToken) {
                setToken(authToken);
                setTimeout(() => navigate('/'), 1500);
            } else {
                setError('Auto-login failed. Please log in manually.');
            }
        } catch (err: any) {
            if (err.response?.data) {
                const errors = err.response.data;
                const errorMessage = errors.username?.[0] || errors.email?.[0] || errors.password?.[0] || 'Registration failed.';
                setError(errorMessage);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderUsernameFeedback = () => {
        if (!username) return null;
        if (isCheckingUsername) {
            return (
                <p className="text-xs text-zinc-500 mt-1.5 flex items-center">
                    <svg className="animate-spin h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking availability...
                </p>
            );
        }
        if (isUsernameAvailable === true) return <p className="text-xs text-green-400 mt-1.5 flex items-center"><CheckIcon /><span className="ml-1">Username is available</span></p>;
        if (isUsernameAvailable === false) return <p className="text-xs text-red-400 mt-1.5 flex items-center"><XIcon /><span className="ml-1">Username is already taken</span></p>;
        return null;
    };
    
    const renderPasswordFeedback = () => {
        if (!password) return null;
        const requirements = [
            { text: "8+ characters", valid: password.length >= 8 },
            { text: "Lowercase", valid: /[a-z]/.test(password) },
            { text: "Uppercase", valid: /[A-Z]/.test(password) },
            { text: "Number", valid: /[0-9]/.test(password) },
            { text: "Special char", valid: /[\W_]/.test(password) },
        ];

        return (
            <div className="mt-2 flex flex-wrap gap-2">
                {requirements.map(req => (
                    <span 
                        key={req.text} 
                        className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                            req.valid 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                    >
                        {req.valid ? <CheckIcon /> : <XIcon />}
                        <span className="ml-1">{req.text}</span>
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-[#09090b]">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-5">
                        <ShieldIcon />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create an account</h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Start securing your credentials today</p>
                </div>

                {/* Card */}
                <div className="as-card p-8">
                    {success && (
                        <div className="as-alert-success mb-6">
                            <CheckIcon />
                            <span className="ml-2">{success}</span>
                        </div>
                    )}
                    
                    {error && (
                        <div className="as-alert-danger mb-6">
                            <XIcon />
                            <span className="ml-2">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
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
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>
                            {renderUsernameFeedback()}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
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
                                    placeholder="Create a password"
                                    required
                                />
                            </div>
                            {renderPasswordFeedback()}
                        </div>

                        <div>
                            <label htmlFor="password2" className="block text-sm font-medium text-zinc-300 mb-2">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockIcon />
                                </div>
                                <input
                                    type="password"
                                    id="password2"
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    className="as-input pl-10"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                            {password2 && password !== password2 && (
                                <p className="text-xs text-red-500 mt-1.5 flex items-center"><XIcon /><span className="ml-1">Passwords do not match</span></p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full as-btn-primary py-3 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <span>Create account</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                        <p className="text-sm text-zinc-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
                
                {/* Footer */}
                <p className="mt-6 text-center text-xs text-zinc-600">
                    Protected by end-to-end encryption
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
