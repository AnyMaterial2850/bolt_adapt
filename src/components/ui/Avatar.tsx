import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, fallback, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-24 h-24 text-2xl',
  };

  if (!src) {
    return (
      <div
        className={cn(
          'rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {fallback || <User className={cn('w-5 h-5', size === 'lg' && 'w-8 h-8')} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Profile"
      className={cn(
        'rounded-full object-cover',
        sizeClasses[size],
        className
      )}
    />
  );
}