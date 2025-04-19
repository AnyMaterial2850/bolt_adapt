import { PlanHabitItem } from './PlanHabitItem';
import { format } from 'date-fns';
import type { UserHabit } from '../../types/database';
import { DebugPushNotificationButton } from './DebugPushNotificationButton';

interface ScheduledHabit {
  habit: UserHabit;
  eventTime: string;
  reminderTime: string | null;
  label: string | null;
}

interface PlanTabPresentationProps {
  scheduledHabits: ScheduledHabit[];
  completions: Record<string, boolean>;
  selectedDate: Date;
  currentDay: string;
  showCelebration: boolean;
  showDebugData: boolean;
  onToggleDebugData: () => void;
  onToggleCompletion: (habitId: string, date: Date, eventTime: string) => Promise<boolean>;
  onReminderToggle: (habitId: string, eventTime: string, newReminderTime: string | null) => Promise<void>;
}

export function PlanTabPresentation({
  scheduledHabits,
  completions,
  selectedDate,
  currentDay,
  showCelebration,
  showDebugData,
  onToggleDebugData,
  onToggleCompletion,
  onReminderToggle,
}: PlanTabPresentationProps) {
  return (
    <div className="space-y-6 pt-8 my-2">
      <DebugPushNotificationButton />
      {/* Simple reminder debugging info */}
      <div className="mb-2 px-4 py-1 text-xs text-gray-500 flex items-center gap-2">
        <button
          onClick={onToggleDebugData}
          className="text-xs text-blue-500 underline"
        >
          {showDebugData ? 'Hide' : 'Check'} Reminders
        </button>

        {showDebugData && (
          <div className="text-xs">
            <span>Scheduled habits: {scheduledHabits.length} for {currentDay}</span>
            {scheduledHabits.length > 0 && scheduledHabits.some(h => h.reminderTime) ? (
              <span className="text-green-600 ml-2">✓ Reminders found</span>
            ) : (
              <span className="text-gray-500 ml-2">No reminders set for today</span>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-600 px-1">
          When you have completed your habit, make sure to track it
        </p>

        <div className="space-y-3">
          {scheduledHabits.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <p className="text-gray-600">No habits scheduled for this day</p>
            </div>
          ) : (
            scheduledHabits.map(({ habit, eventTime, reminderTime, label }, index) => {
              const dateStr = format(selectedDate, 'yyyy-MM-dd');
              const habitKey = `${habit.id}-${dateStr}-${eventTime}`;
              const isCompleted = completions[habitKey] || false;

              // Extract event number from eventTime if it's a sub-event
              const displayTitle = eventTime.includes('-')
                ? `Event ${parseInt(eventTime.split('-')[1]) + 1}`
                : undefined;

              return (
                <PlanHabitItem
                  key={`${habit.id}-${eventTime}-${index}`}
                  habit={habit}
                  eventTime={eventTime}
                  reminderTime={reminderTime}
                  isCompleted={isCompleted}
                  onToggle={() => onToggleCompletion(habit.id, selectedDate, eventTime)}
                  onReminderToggle={async (newReminderTime: string | null) =>
                    await onReminderToggle(habit.id, eventTime, newReminderTime)
                  }
                  displayTitle={displayTitle}
                  label={label}
                />
              );
            })
          )}
        </div>
      </div>

      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-success-500 text-white px-8 py-4 rounded-full shadow-lg animate-celebrate text-lg font-medium">
            🎉 All habits completed! 🎉
          </div>
        </div>
      )}
    </div>
  );
}