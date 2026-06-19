import * as React from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
};

export function Select({ className, options, placeholder, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'glass-input flex h-10 w-full rounded-xl px-3 py-2 text-sm text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
        className,
      )}
      {...props}
    >
      {placeholder ? <option value="" className="bg-[#0d0d1f] text-muted-foreground">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#0d0d1f] text-foreground">
          {option.label}
        </option>
      ))}
      {children}
    </select>
  );
}
