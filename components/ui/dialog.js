import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';

export function Dialog({ open, onClose, title, description, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative glass-strong w-full max-w-md p-6 text-fg">
        {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <button
          type="button"
          className={cn('btn btn-glass mt-6 self-end')}
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
