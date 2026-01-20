// src/components/PrivacyGuard.tsx

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import { usePrivacyGuard } from '../contexts/PrivacyGuardContext';

interface PrivacyGuardProps {
  children: ReactNode;
}

const PrivacyGuard: React.FC<PrivacyGuardProps> = ({ children }) => {
  const { isBlurred, enablePrivacyBlur } = usePrivacyGuard();

  // Don't render overlay if feature is disabled
  const showOverlay = enablePrivacyBlur && isBlurred;

  return (
    <>
      {children}
      
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: isBlurred ? 0 : 0.3, // Instant lock, smooth unlock
              ease: 'easeOut' 
            }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xl flex items-center justify-center"
            aria-live="polite"
            aria-label="Privacy screen active"
          >
            {/* Shield Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ 
                duration: isBlurred ? 0 : 0.2, // Instant on lock, smooth on unlock
                delay: isBlurred ? 0 : 0.05 
              }}
              className="flex flex-col items-center gap-4 text-center px-6"
            >
              {/* Logo Container */}
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-150" />
                
                {/* Icon container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                  <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2} />
                </div>
                
                {/* Shield badge */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 border-2 border-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2 mt-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  AccountSafe Vault Locked
                </h1>
                <p className="text-sm sm:text-base text-zinc-400 max-w-xs">
                  Focus window to view contents
                </p>
              </div>

              {/* Subtle pulse indicator */}
              <div className="flex items-center gap-2 mt-4 text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase tracking-wider">Protected</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PrivacyGuard;
