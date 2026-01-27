import React from 'react';

// Input variants
export type InputVariant = 'default' | 'filled' | 'ghost';
export type InputSize = 'default' | 'sm' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  inputSize?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

// Variant styles mapping
const variantStyles: Record<InputVariant, string> = {
  default: `
    border border-input bg-transparent
    focus:border-primary focus:ring-primary/20
    dark:border-secondary-700 dark:bg-secondary-900/50
    dark:focus:border-primary-400 dark:focus:ring-primary-400/20
  `,
  filled: `
    border border-transparent bg-secondary-100
    focus:border-primary focus:ring-primary/20 focus:bg-transparent
    dark:bg-secondary-800 dark:focus:bg-secondary-900
    dark:focus:border-primary-400 dark:focus:ring-primary-400/20
  `,
  ghost: `
    border border-transparent bg-transparent
    hover:bg-secondary-100/50
    focus:border-primary focus:ring-primary/20 focus:bg-transparent
    dark:hover:bg-secondary-800/50
    dark:focus:border-primary-400 dark:focus:ring-primary-400/20
  `,
};

// Size styles mapping
const sizeStyles: Record<InputSize, string> = {
  default: 'h-10 px-3 py-2 text-sm',
  sm: 'h-8 px-2.5 py-1.5 text-xs',
  lg: 'h-12 px-4 py-3 text-base',
};

// Icon size mapping
const iconSizeStyles: Record<InputSize, string> = {
  default: 'w-4 h-4',
  sm: 'w-3.5 h-3.5',
  lg: 'w-5 h-5',
};

// Base input styles
const baseStyles = `
  flex w-full rounded-lg
  text-foreground placeholder:text-muted-foreground
  transition-all duration-200 ease-in-out
  focus:outline-none focus:ring-2
  disabled:cursor-not-allowed disabled:opacity-50
  dark:text-secondary-100 dark:placeholder:text-secondary-500
`;

// Label styles
const labelStyles = `
  block text-sm font-medium text-foreground mb-1.5
  dark:text-secondary-200
`;

// Error styles
const errorStyles = `
  border-destructive focus:border-destructive focus:ring-destructive/20
  dark:border-destructive-500 dark:focus:border-destructive-400
`;

// Hint/Error text styles
const hintStyles = `
  mt-1.5 text-xs text-muted-foreground
  dark:text-secondary-400
`;

const errorTextStyles = `
  mt-1.5 text-xs text-destructive
  dark:text-destructive-400
`;

// Input Component
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    variant = 'default', 
    inputSize = 'default',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    rightElement,
    fullWidth = true,
    type = 'text',
    ...props 
  }, ref) => {
    const hasError = !!error;
    
    const inputClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[inputSize]}
      ${hasError ? errorStyles : ''}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon || rightElement ? 'pr-10' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const wrapperClassName = fullWidth ? 'w-full' : '';

    return (
      <div className={wrapperClassName}>
        {label && (
          <label className={labelStyles}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-secondary-500 ${iconSizeStyles[inputSize]}`}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={inputClassName}
            {...props}
          />
          {(rightIcon || rightElement) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-secondary-500">
              {rightElement || (
                <span className={iconSizeStyles[inputSize]}>
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>
        {hint && !hasError && (
          <p className={hintStyles}>{hint}</p>
        )}
        {hasError && (
          <p className={errorTextStyles}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className = '', 
    variant = 'default',
    label,
    error,
    hint,
    fullWidth = true,
    ...props 
  }, ref) => {
    const hasError = !!error;
    
    const textareaClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      min-h-[80px] px-3 py-2 text-sm resize-none
      ${hasError ? errorStyles : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const wrapperClassName = fullWidth ? 'w-full' : '';

    return (
      <div className={wrapperClassName}>
        {label && (
          <label className={labelStyles}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={textareaClassName}
          {...props}
        />
        {hint && !hasError && (
          <p className={hintStyles}>{hint}</p>
        )}
        {hasError && (
          <p className={errorTextStyles}>{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, ...props }, ref) => {
    const SearchIcon = (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    );

    const ClearButton = value && onClear ? (
      <button
        type="button"
        onClick={onClear}
        className="p-1 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    ) : null;

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={SearchIcon}
        rightElement={ClearButton}
        value={value}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default Input;
