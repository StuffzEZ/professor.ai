import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-bg-surface border border-border rounded-button px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';