import { createPortal } from 'react-dom';
import { Button } from './button';

export function AlertDialog({ open, onOpenChange, title, description, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="glass-card relative z-10 w-full max-w-md rounded-2xl p-6 animate-scale-in">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
