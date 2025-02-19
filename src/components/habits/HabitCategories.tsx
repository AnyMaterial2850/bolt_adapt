import { cn } from '../../lib/utils';
import { HabitCategory } from '../../types/database';

interface HabitCategoriesProps {
  activeCategory: HabitCategory;
  onCategoryChange: (category: HabitCategory) => void;
}

const categories: { id: HabitCategory; label: string }[] = [
  { id: 'eat', label: 'EAT' },
  { id: 'move', label: 'MOVE' },
  { id: 'sleep', label: 'SLEEP' },
  { id: 'mind', label: 'MIND' },
];

export function HabitCategories({ activeCategory, onCategoryChange }: HabitCategoriesProps) {
  return (
    <div className="flex rounded-full bg-gray-100 p-1">
      {categories.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onCategoryChange(id)}
          className={cn(
            'flex-1 py-1.5 text-sm font-medium transition-colors rounded-full',
            activeCategory === id
              ? 'text-primary-500 bg-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}