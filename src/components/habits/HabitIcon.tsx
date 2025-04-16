import { Icon } from '@iconify/react';
import { cn } from '../../lib/utils';
import { getCategoryColor, getCategoryIcon } from '../../config/categories';

interface HabitIconProps {
  icon: string | null;
  category: 'eat' | 'move' | 'mind' | 'sleep';
  className?: string;
  colorByCategory?: boolean;
}

export function HabitIcon({ icon, category, className, colorByCategory = true }: HabitIconProps) {
  // Determine the icon to use, prioritizing the passed icon, then category default
  const iconToUse = icon && icon.includes(':') ? icon : getCategoryIcon(category);

  return (
    <div className={cn(
      'inline-flex items-center justify-center',
      colorByCategory ? `text-${category}-500` : '',
      className
    )}>
      <Icon
        icon={iconToUse}
        className="w-12 h-12"  // Increased icon size
        onError={(error) => {
          console.error(`Failed to render icon "${iconToUse}":`, error);
          return <span className="w-12 h-12 flex items-center justify-center">•</span>;
        }}
      />
    </div>
  );
}
