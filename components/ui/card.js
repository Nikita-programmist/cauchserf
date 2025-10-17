import * as React from 'react';

import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-[var(--radius)] border border-border bg-card text-card-foreground shadow-soft-lg', className)}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1 rounded-t-[var(--radius)] px-6 py-5', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
);
CardTitle.displayName = 'CardTitle';

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

const CardContent = ({ className, ...props }) => (
  <div className={cn('grid gap-4 px-6 pb-6', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center gap-2 px-6 pb-6', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
