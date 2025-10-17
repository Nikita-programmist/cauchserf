import React from 'react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn('input-base pr-10 appearance-none', className)} {...props}>
      {children}
    </select>
  );
});
