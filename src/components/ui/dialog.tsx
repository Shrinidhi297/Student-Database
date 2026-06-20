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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-3xl rounded-t-2xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.55)] animate-scale-in sm:rounded-2xl max-h-[92dvh] flex flex-col">
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
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-5 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight sm:text-xl">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p> : null}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="shrink-0 min-h-[36px] min-w-[36px]">
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}
