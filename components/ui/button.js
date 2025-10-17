import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius)] text-sm font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 focus-visible:ring-offset-background',
        outline:
          'border border-primary/40 bg-transparent text-primary shadow-soft hover:bg-primary/10 focus-visible:ring-offset-background',
        ghost: 'bg-transparent text-foreground hover:bg-muted/60 focus-visible:ring-offset-background',
        accent:
          'bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 focus-visible:ring-offset-background',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
