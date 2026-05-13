import React from 'react';
import { usePwnedCheck } from '../../../hooks/usePwnedCheck';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface BreachStatusProps {
  password?: string;
  isExpanded?: boolean;
}

export const BreachStatus: React.FC<BreachStatusProps> = ({ password, isExpanded }) => {
  const { breachCount, isChecking, error } = usePwnedCheck(password || '');

  if (!password) return null;

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Checking for breaches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-500">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Check failed</span>
      </div>
    );
  }

  const isPwned = breachCount > 0;

  return (
    <div className={clsx(
      "flex items-center gap-2 px-2 py-1 rounded-md transition-colors",
      isPwned 
        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
    )}>
      {isPwned ? (
        <>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Leaked {breachCount.toLocaleString()} times
          </span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Secure</span>
        </>
      )}
    </div>
  );
};
