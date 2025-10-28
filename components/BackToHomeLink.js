import Link from 'next/link';

import { cn } from '../lib/utils';

export function BackToHomeLink({ href = '/', className }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex w-max items-center gap-2 text-sm font-medium text-fg/80 transition hover:text-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
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

export default BackToHomeLink;
