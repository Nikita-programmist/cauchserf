import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  solid: 'btn-solid',
  ghost: 'btn-ghost',
  glass: 'btn-glass'
};

export const Button = React.forwardRef(function Button(
  { className, variant = 'solid', asChild = false, ...props },
  ref
) {
  const Component = asChild ? 'span' : 'button';
  return (
    <Component
      ref={ref}
      className={cn('btn', variants[variant], className)}
      {...props}
    />
  );
});
