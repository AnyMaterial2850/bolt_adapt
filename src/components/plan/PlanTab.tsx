import { PlanHabitItem } from './PlanHabitItem';
import { format } from 'date-fns';
import type { UserHabit } from '../../types/database';
import { useOutletContext } from 'react-router-dom';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';
import { useCompletionStore } from '../../stores/completionStore';
import confetti from 'canvas-confetti';

interface ScheduledHabit {
  habit: UserHabit;
  eventTime: string;
  reminderTime: string | null;
}

interface PlanTabProps {
  habits: UserHabit[];
  onToggleCompletion: (habitId: string, date: Date, eventTime: string) => Promise<boolean>;
  completions: Record<string, boolean>;
}

interface LayoutContext {
  selectedDate: Date;
}

export function PlanTab({ habits, onToggleCompletion, completions }: PlanTabProps) {
  const { selectedDate } = useOutletContext<LayoutContext>();
  const [showCelebration, setShowCelebration] = useState(false);
  const { addLog } = useDebugStore();
  const { getCompletionStatus } = useCompletionStore();
  
  // Pure presentational component - no loading logic
  // All data loading is handled in Home.tsx
  
  // Memoize active habits to prevent unnecessary calculations
  const activeHabits = useMemo(() => 
    habits.filter(h => h.active), 
    [habits]
  );

  // Get the day of week (e.g., 'Mon', 'Tue', etc.)
  const currentDay = useMemo(() => 
    format(selectedDate, 'EEE'), 
    [selectedDate]
  );

  // Derive scheduled habits from active habits
  const scheduledHabits = useMemo(() => {
    const habitItems = activeHabits.flatMap(habit => {
      const daySchedule = habit.daily_schedules.find(s => s.day === currentDay);
      if (!daySchedule?.active) return [];

      // One card per schedule
      return daySchedule.schedules.map(schedule => ({
        habit,
        eventTime: schedule.event_time,
        reminderTime: schedule.reminder_time
      }));
    }).sort((a, b) => {
      // Extract the base time for comparison (remove the -index suffix if present)
      const getBaseTime = (time: string) => time.split('-')[0];
      const baseTimeA = getBaseTime(a.eventTime);
      const baseTimeB = getBaseTime(b.eventTime);
      
      // First sort by base time
      const baseTimeComparison = baseTimeA.localeCompare(baseTimeB);
      if (baseTimeComparison !== 0) return baseTimeComparison;
      
      // If base times are the same, sort by event index
      if (a.eventTime.includes('-') && b.eventTime.includes('-')) {
        const indexA = parseInt(a.eventTime.split('-')[1]);
        const indexB = parseInt(b.eventTime.split('-')[1]);
        return indexA - indexB;
      }
      
      return 0;
    });

    return habitItems;
  }, [activeHabits, currentDay]);

  // Handle reminder toggle (this needs to stay in this component)
  const handleReminderToggle = useCallback(async (habitId: string, eventTime: string, newReminderTime: string | null): Promise<void> => {
    try {
      addLog(`${newReminderTime ? 'Adding' : 'Removing'} reminder...`, 'info');

      const habit = habits.find(h => h.id === habitId);
      if (!habit) throw new Error('Habit not found');

      // Update the daily schedules
      const updatedDailySchedules = habit.daily_schedules.map(schedule =>
        schedule.day === currentDay
          ? {
              ...schedule,
              schedules: schedule.schedules.map(s => 
                s.event_time === eventTime
                  ? { ...s, reminder_time: newReminderTime }
                  : s
              )
            }
          : schedule
      );

      // No local state changes needed - let the parent component handle refreshing data

      const { error } = await supabase
        .from('user_habits')
        .update({
          daily_schedules: updatedDailySchedules,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId);

      if (error) {
        throw error;
      }

      addLog(`Reminder ${newReminderTime ? 'added' : 'removed'} successfully`, 'success');
    } catch (err) {
      console.error('Error updating reminder:', err);
      addLog(`Failed to update reminder: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    }
  }, [habits, currentDay, addLog]);

  // Check if all habits are completed - celebration effect
  useEffect(() => {
    if (scheduledHabits.length === 0) return;

    const allCompleted = scheduledHabits.every(({ habit, eventTime }) => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const habitKey = `${habit.id}-${dateStr}-${eventTime}`;
      return completions[habitKey];
    });

    if (allCompleted) {
      setShowCelebration(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#32CD32', '#007FFF', '#FFD54F', '#FF7043'],
        disableForReducedMotion: true
      });
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [completions, scheduledHabits, selectedDate]);

  return (
    <div className="space-y-6 pt-8 my-2">
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
            scheduledHabits.map(({ habit, eventTime, reminderTime }, index) => {
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
                  onReminderToggle={(newReminderTime: string | null) => 
                    handleReminderToggle(habit.id, eventTime, newReminderTime)
                  }
                  displayTitle={displayTitle}
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
