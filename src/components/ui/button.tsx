import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-primary/90 text-primary-foreground shadow-[0_12px_32px_-18px_rgba(128,101,255,0.6)] hover:bg-primary backdrop-blur-xl border border-white/10',
  secondary: 'glass-strong text-foreground hover:bg-white/10',
  outline: 'glass text-foreground hover:bg-white/8',
  ghost: 'text-foreground hover:bg-white/6',
  destructive: 'bg-destructive/90 text-destructive-foreground hover:bg-destructive backdrop-blur-xl border border-white/10',
  success: 'bg-success/90 text-success-foreground hover:bg-success backdrop-blur-xl border border-white/10',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-full px-3 text-sm',
  default: 'h-10 rounded-full px-4 py-2',
  lg: 'h-11 rounded-full px-6 text-base',
  icon: 'h-10 w-10 rounded-full',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
