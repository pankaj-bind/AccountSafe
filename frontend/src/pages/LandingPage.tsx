import React from 'react';
import { BookOpen, ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '../components/ui';

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
            Welcome to <span className="text-primary dark:text-primary-400">AccountSafe</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-xl mx-auto px-4">
            Protected by AES-256-GCM authenticated encryption with PBKDF2 key derivation. Our managed security architecture ensures your data is encrypted securely at rest
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <ButtonLink 
              to="/login" 
              variant="default"
              size="lg"
              className="shadow-lg shadow-primary/25 hover:shadow-primary/40"
            >
              Log in to your vault
            </ButtonLink>
            <ButtonLink 
              to="/register" 
              variant="outline"
              size="lg"
            >
              Create free account
            </ButtonLink>
          </div>
          
          {/* Secondary CTA - Security Architecture */}
          <div className="mt-4 sm:mt-6 flex justify-center px-4">
            <ButtonLink
              to="/docs/security"
              variant="ghost"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              leftIcon={<BookOpen className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4 opacity-50" />}
            >
              Security Architecture
            </ButtonLink>
          </div>
          
          {/* Trust indicators */}
            <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-600 dark:text-zinc-500 px-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Zero-Knowledge Architecture
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Industry-Standard Encryption at Rest
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Secure Credential Management
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Managed Security Architecture
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
