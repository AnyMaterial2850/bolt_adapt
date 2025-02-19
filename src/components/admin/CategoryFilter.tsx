import { Button } from '../ui/Button';
import type { HabitCategory } from '../../types/database';

interface CategoryFilterProps {
  selectedCategory: HabitCategory | 'all';
  onCategoryChange: (category: HabitCategory | 'all') => void;
  categoryCounts: Record<HabitCategory | 'all', number>;
}

const CATEGORIES: { value: HabitCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'eat', label: 'EAT' },
  { value: 'move', label: 'MOVE' },
  { value: 'mind', label: 'MIND' },
  { value: 'sleep', label: 'SLEEP' },
];

export function CategoryFilter({ selectedCategory, onCategoryChange, categoryCounts }: CategoryFilterProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h2 className="text-sm font-medium text-gray-700 mb-3">Filter by Category</h2>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'primary' : 'secondary'}
            onClick={() => onCategoryChange(category.value)}
            size="sm"
            className="min-w-[100px]"
          >
            {category.label} ({categoryCounts[category.value]})
          </Button>
        ))}
      </div>
    </div>
  );
}