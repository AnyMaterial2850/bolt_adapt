import { Check, Plus, Settings, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Habit, UserHabit } from '../../types/database';
import { HabitIcon } from './HabitIcon';
import { HabitAssociatedContent } from './HabitAssociatedContent';
import { useState } from 'react';

interface HabitItemProps {
  habit: Habit;
  isSelected: boolean;
  onSelect: (habit: Habit, isSelected: boolean, userHabitId?: string) => void;
  userHabits: UserHabit[];
  selectedTargets: Record<string, number>;
  showDescription?: boolean;
  onConfigure?: (habitId: string, userHabitId?: string) => void; // New prop
}

export function HabitItem({ 
  habit, 
  isSelected, 
  onSelect, 
  userHabits,
  selectedTargets,
  showDescription = true,
  onConfigure // New prop
}: HabitItemProps) {
  // State for showing/hiding associated content
  const [showContent, setShowContent] = useState(false);
  
  // Check if habit has associated content
  const hasAssociatedContent = 
    (habit.bottom_line_items && habit.bottom_line_items.length > 0) ||
    (habit.go_deeper_urls && habit.go_deeper_urls.length > 0);
  const handleSelect = () => {
    const userHabit = userHabits.find(uh => uh.habit_id === habit.id);
    onSelect(habit, isSelected, userHabit?.id);
  };
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card's onClick
    setShowContent(!showContent);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card's onClick
    if (onConfigure) {
      const userHabit = userHabits.find(uh => uh.habit_id === habit.id);
      onConfigure(habit.id, userHabit?.id);
    }
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
      
      <div className="flex items-center gap-2">
        {/* Info button - Shows up only when habit has associated content */}
        {hasAssociatedContent && (
          <div className="relative group">
            <div
              onClick={handleInfoClick}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer bg-green-100 text-green-600 hover:bg-green-200"
              role="button"
              tabIndex={0}
              aria-label={`Learn more about: ${habit.title}`}
            >
              <Info className="w-4 h-4" />
            </div>
            <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap">
              Learn More
            </div>
          </div>
        )}
      
        {/* Configure button - More prominent and with tooltip */}
        {onConfigure && (
          <div className="relative group">
            <div
              onClick={handleConfigure}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
              role="button"
              tabIndex={0}
              aria-label={`Configure habit: ${habit.title}`}
            >
              <Settings className="w-4 h-4" />
            </div>
            <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap">
              Configure Habit
            </div>
          </div>
        )}
        
        {/* Existing toggle button */}
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
      {/* Expandable associated content */}
      {showContent && hasAssociatedContent && (
        <div onClick={(e) => e.stopPropagation()} className="mt-3 px-3 pb-3">
          <HabitAssociatedContent
            bottomLineItems={habit.bottom_line_items || []}
            goDeeperTitles={habit.go_deeper_titles || []}
            goDeeperUrls={habit.go_deeper_urls || []}
          />
        </div>
      )}
    </div>
  );
}
