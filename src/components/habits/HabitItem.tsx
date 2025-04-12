import { Settings, Check, Plus, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import type { Habit, UserHabit } from '../../types/database';
import { HabitIcon } from './HabitIcon';
import { HabitContent } from './HabitContent';
import { useState } from 'react';

interface HabitItemProps {
  habit: Habit;
  isSelected: boolean;
  onSelect: (habit: Habit, isSelected: boolean) => void;
  userHabits: UserHabit[];
  onSelectTarget?: (habitId: string, target: number) => void;
  selectedTarget?: number;
  selectedTargets: Record<string, number>;
}

export function HabitItem({ 
  habit, 
  isSelected, 
  onSelect, 
  userHabits, 
  onSelectTarget,
  selectedTarget,
  selectedTargets
}: HabitItemProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = habit && (
    habit.content_type ||
    (habit.bottom_line_items && habit.bottom_line_items.length > 0) ||
    (habit.go_deeper_titles && habit.go_deeper_titles.length > 0) ||
    (habit.target && habit.target.length > 0)
  );

  const handleTargetSelect = (target: number) => {
    if (onSelectTarget) {
      onSelectTarget(habit.id, target);
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm hover:shadow transition-shadow duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
          <HabitIcon
            icon={habit.icon || ''}
            category={habit.category || 'move'}
            className="text-primary-500 w-5 h-5 sm:w-6 sm:h-6"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate text-base sm:text-lg">{habit.title}</h3>
          {habit.description ? (
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-2">
              {habit.description}
            </p>
          ) : null}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Add/Remove Button */}
          <button
            onClick={() => onSelect(habit, isSelected)}
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-success-500 text-white hover:bg-success-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            aria-label={isSelected ? 'Remove habit' : 'Add habit'}
          >
            {isSelected ? (
              <Check className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
          {/* Configure Button - only enable if selected */}
          <button
            onClick={() => {
              if (isSelected) {
                const userHabit = userHabits.find(uh => uh.habit_id === habit.id);
                if (userHabit) {
                  navigate(`/habits/${userHabit.id}`);
                } else {
                  console.error("Could not find user_habit for selected habit:", habit.title);
                }
              }
            }}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
              isSelected ? "text-gray-500 hover:bg-gray-100" : "text-gray-300 cursor-not-allowed"
            )}
            title={isSelected ? "Configure habit" : "Add habit to configure"}
            disabled={!isSelected}
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {hasContent && (
        <div className="border-t pt-3 sm:pt-4">
          {isSelected && habit.target && habit.target.length > 0 ? (
            <HabitContent 
              habit={habit} 
              onSelectTarget={handleTargetSelect}
              selectedTarget={selectedTarget}
              selectedTargets={selectedTargets}
            />
          ) : (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-sm sm:text-base text-gray-600 hover:text-gray-900 py-1 sm:py-2"
              >
                <span className="font-medium">Learn More</span>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ease-in-out",
                    isExpanded ? "rotate-180" : ""
                  )}
                />
              </button>

              {isExpanded && (
                <div className="mt-3 sm:mt-4">
                  <HabitContent 
                    habit={habit} 
                    onSelectTarget={handleTargetSelect}
                    selectedTarget={selectedTarget}
                    selectedTargets={selectedTargets}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
