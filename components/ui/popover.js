import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export function Popover({ triggerLabel, children, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-glass"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          role="dialog"
          className={cn('absolute right-0 mt-3 w-56 glass p-4 shadow-lg', className)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
