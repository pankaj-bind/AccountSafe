import React, { useMemo } from 'react';
import zxcvbn from 'zxcvbn';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface PasswordStrengthMeterProps {
  password: string;
  showDetails?: boolean;
}

const strengthLevels = [
  { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-500', width: '20%' },
  { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-500', width: '40%' },
  { label: 'Fair', color: 'bg-yellow-500', text: 'text-yellow-500', width: '60%' },
  { label: 'Good', color: 'bg-blue-500', text: 'text-blue-500', width: '80%' },
  { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500', width: '100%' },
];

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  showDetails = true 
}) => {
  const result = useMemo(() => zxcvbn(password), [password]);
  
  if (!password) return null;

  const score = result.score;
  const level = strengthLevels[score];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex justify-between items-center text-xs font-medium">
        <span className="text-zinc-500 dark:text-zinc-400">Password Strength</span>
        <span className={clsx('transition-colors duration-300', level.text)}>
          {level.label}
        </span>
      </div>

      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: level.width }}
          className={clsx('h-full transition-colors duration-500', level.color)}
        />
      </div>

      {showDetails && result.feedback.warning && (
        <p className="text-xs text-red-500/80 mt-1">
          {result.feedback.warning}
        </p>
      )}

      {showDetails && result.feedback.suggestions.length > 0 && (
        <ul className="text-[10px] text-zinc-500 dark:text-zinc-500 list-disc list-inside">
          {result.feedback.suggestions.map((suggestion, i) => (
            <li key={i}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
