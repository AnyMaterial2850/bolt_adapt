import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserHabit } from '../../types/database';
import { format, parse } from 'date-fns';
import { HabitIcon } from '../habits/HabitIcon';

interface PlanHabitItemProps {
  habit: UserHabit;
  eventTime: string;
  reminderTime: string | null;
  isCompleted: boolean;
  onToggle: () => Promise<boolean>;
  onReminderToggle?: (newReminderTime: string | null) => Promise<void>;
  disabled?: boolean;
  displayTitle?: string;
}

export function PlanHabitItem({ 
  habit, 
  eventTime, 
  reminderTime,
  isCompleted, 
  onToggle,
  onReminderToggle,
  disabled,
  displayTitle,
}: PlanHabitItemProps) {
  const [localIsCompleted, setLocalIsCompleted] = useState(isCompleted);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalIsCompleted(isCompleted);
  }, [isCompleted]);

  // Convert 24h time to 12h format
  const formattedEventTime = eventTime.includes('-')
    ? `Event ${parseInt(eventTime.split('-')[1]) + 1}`
    : format(
        parse(eventTime, 'HH:mm', new Date()),
        'h:mm a'
      );

  // Format reminder time if exists
  const formattedReminderTime = reminderTime ? format(
    parse(reminderTime, 'HH:mm', new Date()),
    'h:mm a'
  ) : null;

  const handleToggle = async () => {
    if (disabled) return;

    // Immediately toggle the local state
    const newCompletedState = !localIsCompleted;
    setLocalIsCompleted(newCompletedState);

    try {
      const success = await onToggle();
      
      if (!success) {
        // Revert if server update fails
        setLocalIsCompleted(isCompleted);
      }
    } catch (error) {
      // Revert if an error occurs
      setLocalIsCompleted(isCompleted);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4">
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
        {/* Left Section: Icon (Slightly Smaller) */}
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
          <HabitIcon 
            icon={habit.habit?.icon || ''}
            category={habit.habit?.category || 'move'}
            className="w-12 h-12"
            colorByCategory={true}
          />
        </div>

        {/* Middle Section: Label and Time */}
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 truncate text-base">
            {displayTitle || habit.habit?.title}
          </h3>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>{formattedEventTime}</span>
            {reminderTime && (
              <div className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                <span>{formattedReminderTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Completion Button (Centered) */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              localIsCompleted
                ? 'bg-success-500 text-white hover:bg-success-600'
                : disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Check className={cn(
              "w-4 h-4",
              !localIsCompleted && "opacity-70"
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}
