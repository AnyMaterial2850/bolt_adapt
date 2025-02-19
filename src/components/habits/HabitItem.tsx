import { Settings, Check, Plus, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import type { UserHabit } from '../../types/database';
import { HabitIcon } from './HabitIcon';
import { HabitContent } from './HabitContent';
import { useState } from 'react';

interface HabitItemProps {
  habit: UserHabit;
  onToggle: (habitId: string) => void;
}

export function HabitItem({ habit, onToggle }: HabitItemProps) {
  const navigate = useNavigate();
  const isActive = habit.active;
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = habit.habit && (
    habit.habit.content_type ||
    (habit.habit.bottom_line_items && habit.habit.bottom_line_items.length > 0) ||
    (habit.habit.go_deeper_titles && habit.habit.go_deeper_titles.length > 0)
  );

  return (
    <div className="bg-white rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
          <HabitIcon 
            icon={habit.habit?.icon} 
            category={habit.habit?.category || 'move'} 
            className="text-primary-500"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate">{habit.habit?.title}</h3>
          {habit.habit?.description ? (
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
              {habit.habit.description}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {isActive ? 'Daily' : `0/${habit.frequency_per_day} TIMES`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(habit.id)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              isActive
                ? 'bg-success-500 text-white hover:bg-success-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {isActive ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => navigate(`/habits/${habit.id}`)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
            title="Configure habit"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {hasContent && (
        <div className="border-t pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="font-medium">Learn More</span>
            <ChevronDown 
              className={cn(
                "w-5 h-5 transition-transform duration-300 ease-in-out",
                isExpanded ? "rotate-180" : ""
              )}
            />
          </button>

          <div className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}>
            <div className="overflow-hidden">
              <div className={cn(
                "mt-4 transition-all duration-300 ease-in-out",
                isExpanded ? "translate-y-0" : "-translate-y-2"
              )}>
                {habit.habit && <HabitContent habit={habit.habit} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}