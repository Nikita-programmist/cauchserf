// @ts-nocheck
import { cn } from '../../lib/utils';

export function SelectionChip({ label, selected, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border border-white/15 px-3 py-1 text-sm transition',
        selected ? 'bg-accent/20 text-fg border-accent/60' : 'bg-white/5 text-fg/80 hover:bg-white/10',
        className
      )}
    >
      {label}
    </button>
  );
}
