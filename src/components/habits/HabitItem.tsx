import { Check, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Habit, UserHabit } from '../../types/database';
import { HabitIcon } from './HabitIcon';

interface HabitItemProps {
  habit: Habit;
  isSelected: boolean;
  onSelect: (habit: Habit, isSelected: boolean, userHabitId?: string) => void;
  userHabits: UserHabit[];
  selectedTargets: Record<string, number>;
  showDescription?: boolean;
}

export function HabitItem({ 
  habit, 
  isSelected, 
  onSelect, 
  userHabits,
  selectedTargets,
  showDescription = true
}: HabitItemProps) {
  const handleSelect = () => {
    const userHabit = userHabits.find(uh => uh.habit_id === habit.id);
    onSelect(habit, isSelected, userHabit?.id);
  };

  return (
    <div 
      className="bg-white rounded-xl p-3 sm:p-4 flex items-center gap-3 shadow-sm hover:shadow transition-shadow duration-200"
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      aria-label={`Habit: ${habit.title}`}
    >
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
        <HabitIcon 
          icon={habit.icon || ''}
          category={habit.category || 'move'}
          className="w-7 h-7"
          colorByCategory={true}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">
          {habit.title}
          {isSelected && habit.target && habit.target.length > 0 && selectedTargets[habit.id] !== undefined && (
            <span> ({selectedTargets[habit.id]} {habit.unit})</span>
          )}
        </h3>
        {showDescription && habit.description && (
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-2">
            {habit.description}
          </p>
        )}
      </div>
      
      <div>
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer',
            isSelected
              ? 'bg-success-500 text-white hover:bg-success-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {isSelected ? (
            <Check className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </div>
      </div>
    </div>
  );
}
