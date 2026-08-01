// src/pages/RegisterPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, checkUsername } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { initializeUserEncryption, storeKeyData } from '../services/encryptionService';
import RecoveryKeyModal from '../components/RecoveryKeyModal';
import { PasswordInput } from '../components/ui';

// Cloudflare Turnstile
interface TurnstileInstance {
    render: (element: HTMLElement, options: Record<string, unknown>) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId: string) => void;
}

declare global {
    interface Window {
        turnstile: TurnstileInstance | undefined;
    }
}

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

    // Recovery key modal
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [recoveryKey, setRecoveryKey] = useState('');

    // Turnstile
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [widgetId, setWidgetId] = useState<string | null>(null);
    const turnstileRef = useRef<HTMLDivElement>(null);

    const { setToken } = useAuth();
    const navigate = useNavigate();

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
        if (!turnstileRef.current || widgetId) return;

        const renderWidget = () => {
            if (window.turnstile && turnstileRef.current && !widgetId) {
                const id = window.turnstile.render(turnstileRef.current, {
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
                setWidgetId(id);
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

        return () => {
            if (widgetId && window.turnstile) {
                window.turnstile.remove(widgetId);
            }
        };
    }, [widgetId]);
    
    useEffect(() => {
        if (!username) {
            setIsUsernameAvailable(null);
            return;
        }
        setIsCheckingUsername(true);
        const timerId = setTimeout(() => {
            checkUsername(username).then(data => {
            .catch(err => console.error(err))