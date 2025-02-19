import { Icon } from '@iconify/react';
import { cn } from '../../lib/utils';

interface HabitIconProps {
  icon: string | null;
  category: 'eat' | 'move' | 'mind' | 'sleep';
  className?: string;
}

const defaultIcons = {
  eat: 'mdi:food-apple',
  move: 'mdi:run',
  mind: 'mdi:brain',
  sleep: 'mdi:sleep',
} as const;

export function HabitIcon({ icon, category, className }: HabitIconProps) {
  const iconToUse = icon || defaultIcons[category];

  return (
    <Icon 
      icon={iconToUse}
      className={cn('w-6 h-6', className)}
    />
  );
}