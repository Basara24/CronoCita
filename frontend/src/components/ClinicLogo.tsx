import { Building2 } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ClinicLogoProps {
  logoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
} as const;

export function ClinicLogo({ logoUrl, name, size = 'md', className }: ClinicLogoProps) {
  const src = resolveAssetUrl(logoUrl);
  const sizeClass = SIZE_CLASSES[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-lg object-cover', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary',
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {name.trim() ? (
        name.trim().charAt(0).toUpperCase()
      ) : (
        <Building2 className={cn(size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5')} />
      )}
    </div>
  );
}
