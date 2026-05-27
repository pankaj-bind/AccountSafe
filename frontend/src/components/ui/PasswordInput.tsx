import React, { useId, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Render a leading lock icon. Off by default so call sites that never had one keep their look. */
  showLeftIcon?: boolean;
  /** Custom leading icon. Implies showLeftIcon. */
  leftIcon?: React.ReactNode;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', showLeftIcon = false, leftIcon, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasLeftIcon = showLeftIcon || !!leftIcon;

    // as-input is the canonical design-system input style. Caller classes are
    // appended so their utilities (e.g. height) win over the base.
    const inputClassName = ['as-input', hasLeftIcon ? 'pl-10' : '', 'pr-10', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="relative w-full">
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-400">
            {leftIcon || <Lock className="w-5 h-5" strokeWidth={1.5} />}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={inputClassName}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-1 right-1 px-2 flex items-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          aria-controls={inputId}
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
