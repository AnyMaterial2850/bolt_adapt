import { cn } from '../../lib/utils';
import { HabitCategory } from '../../types/database';
import { CATEGORY_CONFIG } from '../../config/categories';

interface HabitCategoriesProps {
  activeCategory: HabitCategory;
  onCategoryChange: (category: HabitCategory) => void;
}

export function HabitCategories({ activeCategory, onCategoryChange }: HabitCategoriesProps) {
  return (
    <div className="flex rounded-full bg-gray-100 p-1 max-w-full mx-auto">
      {Object.entries(CATEGORY_CONFIG).map(([id, config]) => (
        <button
          key={id}
          onClick={() => onCategoryChange(id as HabitCategory)}
          className={cn(
            'flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors rounded-full',
            activeCategory === id
              ? `bg-${config.color}-500 text-white shadow-sm`
              : `text-gray-500 hover:text-${config.color}-500`
          )}
        >
          {config.label}
        </button>
      ))}
    </div>
  );
}
