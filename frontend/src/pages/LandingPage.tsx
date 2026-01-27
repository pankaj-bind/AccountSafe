import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b]">
      <div className="flex items-start sm:items-center justify-center min-h-screen px-4 py-8 pt-8 sm:pt-0">
        <div className="text-center max-w-2xl mx-auto">
          {/* Hero Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
            <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-500/20 overflow-hidden">
              <img src="/logo.png" alt="AccountSafe" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-3 sm:mb-4 px-4">
            Welcome to <span className="text-blue-500 dark:text-blue-400">AccountSafe</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-xl mx-auto px-4">
            Protected by AES-256-GCM authenticated encryption with PBKDF2 key derivation. Our managed security architecture ensures your data is encrypted securely at rest
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link 
              to="/login" 
              className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              Log in to your vault
            </Link>
            <Link 
              to="/register" 
              className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
            >
              Create free account
            </Link>
          </div>
          
          {/* Secondary CTA - Security Architecture */}
          <div className="mt-4 sm:mt-6 flex justify-center px-4">
            <Link
              to="/docs/security"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              Security Architecture
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          
          {/* Trust indicators */}
            <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-600 dark:text-zinc-500 px-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Zero-Knowledge Architecture
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Industry-Standard Encryption at Rest
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Secure Credential Management
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Managed Security Architecture
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
