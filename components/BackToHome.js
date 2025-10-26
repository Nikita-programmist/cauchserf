import Link from 'next/link';

import { cn } from '../lib/utils';

export function BackToHome({ href = '/', className }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex w-max items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-fg/80 transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        className
      )}
    >
      <span aria-hidden="true" className="text-base">
        ←
      </span>
      <span>На главную</span>
    </Link>
  );
}

export default BackToHome;
