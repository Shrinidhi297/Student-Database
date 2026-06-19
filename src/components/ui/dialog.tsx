import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function Dialog({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button aria-label="Close dialog overlay" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-card shadow-soft">
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogContent({ className, children, onClose, title, description }: {
  className?: string;
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  description?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
          <X className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}
