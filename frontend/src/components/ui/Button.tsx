import React from 'react';
import { Link } from 'react-router-dom';

// Button Variants - Shadcn/UI inspired design system
export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface ButtonLinkProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  onClick?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

// Variant styles mapping
const variantStyles: Record<ButtonVariant, string> = {
  default: `
    bg-primary text-primary-foreground 
    hover:bg-primary-600 
    focus-visible:ring-primary/50
    shadow-sm hover:shadow-md
    dark:bg-primary-500 dark:hover:bg-primary-400
  `,
  secondary: `
    bg-secondary-100 text-secondary-700 
    hover:bg-secondary-200 
    focus-visible:ring-secondary/50
    dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700
  `,
  outline: `
    border border-input bg-transparent 
    hover:bg-accent hover:text-accent-foreground
    focus-visible:ring-primary/50
    dark:border-secondary-700 dark:hover:bg-secondary-800/50 dark:text-secondary-200
  `,
  ghost: `
    hover:bg-accent hover:text-accent-foreground
    focus-visible:ring-primary/50
    dark:hover:bg-secondary-800/50 dark:text-secondary-300
  `,
  destructive: `
    bg-destructive text-destructive-foreground 
    hover:bg-destructive-600 
    focus-visible:ring-destructive/50
    shadow-sm hover:shadow-md
    dark:bg-destructive-600 dark:hover:bg-destructive-500
  `,
  link: `
    text-primary underline-offset-4 hover:underline
    dark:text-primary-400
  `,
};

// Size styles mapping
const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 py-1.5 text-xs rounded-md',
  lg: 'h-12 px-6 py-3 text-base',
  icon: 'h-10 w-10 p-0',
};

// Base button styles
const baseStyles = `
  inline-flex items-center justify-center gap-2
  rounded-lg font-medium
  transition-all duration-200 ease-in-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:pointer-events-none disabled:opacity-50
  active:scale-[0.98]
`;

// Loading spinner component
const LoadingSpinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg 
    className={`animate-spin ${className}`} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Main Button Component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'default', 
    size = 'default', 
    isLoading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Button as Link Component (for navigation)
export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ 
    className = '', 
    variant = 'default', 
    size = 'default',
    to,
    external = false,
    leftIcon,
    rightIcon,
    onClick,
    children
  }, ref) => {
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    if (external) {
      return (
        <a
          ref={ref}
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClassName}
          onClick={onClick}
        >
          {leftIcon}
          {children}
          {rightIcon}
        </a>
      );
    }

    return (
      <Link
        to={to}
        className={combinedClassName}
        onClick={onClick}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </Link>
    );
  }
);

ButtonLink.displayName = 'ButtonLink';

// Icon Button sizes
type IconButtonSize = 'sm' | 'default' | 'lg';
const iconButtonSizes: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8 p-0',
  default: 'h-10 w-10 p-0',
  lg: 'h-12 w-12 p-0',
};

// Icon Button Component (for icon-only buttons)
interface IconButtonProps extends Omit<ButtonProps, 'size' | 'leftIcon' | 'rightIcon'> {
  size?: IconButtonSize;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = '', variant = 'ghost', size = 'default', children, ...props }, ref) => {
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${iconButtonSizes[size]}
      ${className}
    `.trim().replace(/\s+/g, ' ');
    
    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;
