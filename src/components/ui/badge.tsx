import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'border-white/15 bg-primary/20 text-primary backdrop-blur-xl',
  secondary: 'border-white/10 bg-white/8 text-secondary-foreground backdrop-blur-xl',
  outline: 'border-white/10 text-foreground backdrop-blur-xl',
  success: 'border-white/15 bg-success/20 text-success backdrop-blur-xl',
  muted: 'border-white/8 bg-white/5 text-muted-foreground backdrop-blur-xl',
  destructive: 'border-white/15 bg-destructive/20 text-destructive backdrop-blur-xl',
} as const;

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof badgeVariants;
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
