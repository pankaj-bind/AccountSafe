import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showLeftIcon?: boolean;
  leftIcon?: React.ReactNode;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', showLeftIcon = true, leftIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    // Ensure as-input is always applied as a base class
    const resolvedClassName = className.includes('as-input')
      ? className
      : `as-input ${className}`;

    // Add pl-10 to make room for left icon, and pr-10 for the eye toggle
    const finalClassName = `
      ${resolvedClassName}
      ${showLeftIcon || leftIcon ? 'pl-10' : ''}
      pr-10
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="relative w-full">
        {(showLeftIcon || leftIcon) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-400">
            {leftIcon || <Lock className="w-5 h-5" strokeWidth={1.5} />}
          </div>
        )}
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={finalClassName}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg m-1"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          tabIndex={0}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Eye className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
