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

// Stricter check for Iconify format (prefix:name, no spaces)
function isValidIconifyString(str: string | null | undefined): boolean {
  // Must be a string, contain a colon, have minimum length, and contain no spaces or invalid characters
  return (
    typeof str === 'string' && 
    str.includes(':') && 
    !str.includes(' ') && 
    str.length > 3 &&
    /^[a-zA-Z0-9-_]+:[a-zA-Z0-9-_]+$/.test(str) // Only allow alphanumeric, dash, and underscore
  );
}

export function HabitIcon({ icon, category, className }: HabitIconProps) {
  let iconToUse: string;

  try {
    // Validate the provided icon string
    if (!icon || icon === '' || !isValidIconifyString(icon)) {
      if (icon && icon !== '') { // Log only if an invalid icon was actually provided
        console.warn(`Invalid icon format provided: "${icon}". Falling back to default for category "${category}".`);
      }
      iconToUse = defaultIcons[category];
    } else {
      // Icon is valid
      iconToUse = icon;
    }
  } catch (error) {
    // Fallback to default icon if any error occurs
    console.error(`Error processing icon "${icon}":`, error);
    iconToUse = defaultIcons[category];
  }

  // Wrap the Icon component in an error boundary to prevent rendering failures
  try {
    return (
      <Icon
        icon={iconToUse}
        className={cn('w-6 h-6', className)}
        onError={(error) => {
          console.error(`Failed to render icon "${iconToUse}":`, error);
          // If there's an error rendering the icon, fall back to a default
          return <span className={cn('w-6 h-6 flex items-center justify-center', className)}>•</span>;
        }}
      />
    );
  } catch (error) {
    console.error(`Error rendering icon "${iconToUse}":`, error);
    // Return a simple fallback if the Icon component throws an error
    return <span className={cn('w-6 h-6 flex items-center justify-center', className)}>•</span>;
  }
}
