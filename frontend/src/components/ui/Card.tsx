import React from 'react';

// Card variants
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'default' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

// Variant styles mapping
const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-card border border-border/50
    dark:bg-secondary-900/50 dark:border-secondary-800
  `,
  elevated: `
    bg-card shadow-lg shadow-black/5 border border-border/30
    dark:bg-secondary-900/80 dark:border-secondary-800/50 dark:shadow-black/20
  `,
  outlined: `
    bg-transparent border-2 border-border
    dark:border-secondary-700
  `,
  ghost: `
    bg-transparent
    dark:bg-transparent
  `,
};

// Padding styles mapping
const paddingStyles: Record<'none' | 'sm' | 'default' | 'lg', string> = {
  none: '',
  sm: 'p-3',
  default: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

// Base card styles
const baseStyles = `
  rounded-xl
  transition-all duration-200 ease-in-out
`;

// Hover styles
const hoverStyles = `
  hover:shadow-xl hover:shadow-black/5 hover:border-border
  dark:hover:shadow-black/30 dark:hover:border-secondary-700
`;

// Clickable styles
const clickableStyles = `
  cursor-pointer active:scale-[0.99]
`;

// Card Component
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className = '', 
    variant = 'default',
    padding = 'default',
    hover = false,
    clickable = false,
    children,
    ...props 
  }, ref) => {
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${paddingStyles[padding]}
      ${hover ? hoverStyles : ''}
      ${clickable ? clickableStyles : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-start justify-between gap-4 ${className}`}
        {...props}
      >
        {(title || description) ? (
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-foreground dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground dark:text-secondary-400">
                {description}
              </p>
            )}
          </div>
        ) : children}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer Component
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-6 pt-4 border-t border-border dark:border-secondary-800 flex items-center justify-end gap-3 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Feature Card Component (for landing pages)
interface FeatureCardProps extends Omit<CardProps, 'children'> {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  ...props
}) => {
  return (
    <Card variant="default" hover {...props}>
      {icon && (
        <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground dark:text-secondary-400 leading-relaxed">
        {description}
      </p>
    </Card>
  );
};

export default Card;
