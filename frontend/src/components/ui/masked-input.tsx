import * as React from 'react';
import { cn } from '@/lib/utils';
import { applyMask, type MaskType } from '@/lib/masks';

export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, className, onChange, value, defaultValue, ...props }, ref) => {
    const [internal, setInternal] = React.useState(() =>
      typeof defaultValue === 'string' ? applyMask(mask, defaultValue) : '',
    );

    const displayValue =
      value !== undefined && value !== null ? applyMask(mask, String(value)) : internal;

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const formatted = applyMask(mask, e.target.value);
      e.target.value = formatted;
      if (value === undefined) setInternal(formatted);
      onChange?.(e);
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';
