import React from 'react';

// Badge variants
export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'default' | 'sm' | 'lg';
  dot?: boolean;
  icon?: React.ReactNode;
}

// Variant styles mapping
const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-primary/10 text-primary border-primary/20
    dark:bg-primary/20 dark:text-primary-300 dark:border-primary/30
  `,
  secondary: `
    bg-secondary-100 text-secondary-700 border-secondary-200
    dark:bg-secondary-800 dark:text-secondary-300 dark:border-secondary-700
  `,
  success: `
    bg-success/10 text-success-700 border-success/20
    dark:bg-success/20 dark:text-success-400 dark:border-success/30
  `,
  warning: `
    bg-warning/10 text-warning-700 border-warning/20
    dark:bg-warning/20 dark:text-warning-400 dark:border-warning/30
  `,
  destructive: `
    bg-destructive/10 text-destructive-700 border-destructive/20
    dark:bg-destructive/20 dark:text-destructive-400 dark:border-destructive/30
  `,
  outline: `
    bg-transparent text-foreground border-border
    dark:text-secondary-200 dark:border-secondary-700
  `,
};

// Size styles mapping
const sizeStyles: Record<'default' | 'sm' | 'lg', string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  default: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

// Dot color mapping
const dotColorStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary dark:bg-primary-400',
  secondary: 'bg-secondary-500 dark:bg-secondary-400',
  success: 'bg-success dark:bg-success-400',
  warning: 'bg-warning dark:bg-warning-400',
  destructive: 'bg-destructive dark:bg-destructive-400',
  outline: 'bg-foreground dark:bg-secondary-300',
};

// Base badge styles
const baseStyles = `
  inline-flex items-center gap-1.5
  rounded-full border font-medium
  transition-colors duration-200
`;

// Badge Component
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className = '', 
    variant = 'default',
    size = 'default',
    dot = false,
    icon,
    children,
    ...props 
  }, ref) => {
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <span
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {dot && (
          <span className={`w-1.5 h-1.5 rounded-full ${dotColorStyles[variant]}`} />
        )}
        {icon && !dot && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge Component (for password strength, etc.)
export type StatusType = 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: StatusType;
}

const statusConfig: Record<StatusType, { variant: BadgeVariant; label: string }> = {
  weak: { variant: 'destructive', label: 'Weak' },
  fair: { variant: 'warning', label: 'Fair' },
  good: { variant: 'secondary', label: 'Good' },
  strong: { variant: 'success', label: 'Strong' },
  excellent: { variant: 'success', label: 'Excellent' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} dot {...props}>
      {config.label}
    </Badge>
  );
};

// Count Badge Component (for notifications)
interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({ 
  count, 
  max = 99, 
  variant = 'destructive',
  className = '' 
}) => {
  if (count <= 0) return null;
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge 
      variant={variant} 
      size="sm"
      className={`min-w-[18px] justify-center ${className}`}
    >
      {displayCount}
    </Badge>
  );
};

export default Badge;
