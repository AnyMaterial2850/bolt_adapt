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

import { DebugNotificationButton } from './DebugNotificationButton';
import { DebugPushNotificationButton } from './DebugPushNotificationButton';

export function PlanTab({ habits, onToggleCompletion, completions }: PlanTabProps) {
  const { selectedDate } = useOutletContext<LayoutContext>();
  const [showCelebration, setShowCelebration] = useState(false);
  const { addLog } = useDebugStore();
  const { getCompletionStatus } = useCompletionStore();
  
  // Debugging function - add a button to directly examine habits data
  const [showDebugData, setShowDebugData] = useState(false);
  
  // Pure presentational component - no loading logic
  // All data loading is handled in Home.tsx
  
  // Memoize active habits to prevent unnecessary calculations
  // Only include habits that are active - this is important since our DB
  // now keeps inactive habits for preserving configurations
  const activeHabits = useMemo(() => 
    habits.filter(h => h.active === true), 
    [habits]
  );

  // Get the day of week (e.g., 'Mon', 'Tue', etc.)
  const currentDay = useMemo(() => 
    format(selectedDate, 'EEE'), 
    [selectedDate]
  );

  // Derive scheduled habits from active habits
  const scheduledHabits = useMemo(() => {
    // Add debug logging to better understand what's being processed
    console.log(`Processing ${activeHabits.length} active habits for ${currentDay}`);
    
    const habitItems = activeHabits.flatMap(habit => {
      const daySchedule = habit.daily_schedules?.find(s => s.day === currentDay);
      if (!daySchedule?.active) return [];

      // Debug logging for each habit's schedule
      console.log(`Habit ${habit.id} (${habit.habit?.title}) has ${daySchedule.schedules.length} schedules for ${currentDay}`);

      // One card per schedule
      return daySchedule.schedules.map(schedule => {
        // Enhanced debug log for schedule data
        console.log(`Schedule for ${habit.habit?.title}:`, {
          eventTime: schedule.event_time,
          reminderTime: schedule.reminder_time,
          label: schedule.label,
          reminderTimeType: typeof schedule.reminder_time,
          reminderTimeJSON: JSON.stringify(schedule.reminder_time),
          hasReminder: Boolean(schedule.reminder_time)
        });
        
        // Debug log each specific schedule's reminder
        if (schedule.reminder_time) {
          console.log(`Found reminder for ${habit.habit?.title}: ${schedule.reminder_time}`);
        }
        
        return {
          habit,
          eventTime: schedule.event_time,
          reminderTime: schedule.reminder_time,
          label: schedule.label
        };
      });
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

  // One-time debug log to avoid continuous console spam
  useEffect(() => {
    // Only log once when habits or current day changes
    console.log('Debug Info - Current day:', currentDay);
    console.log('Debug Info - Active habits count:', habits.filter(h => h.active).length);
  }, [habits.length, currentDay]);

  return (
    <div className="space-y-6 pt-8 my-2">
      <DebugNotificationButton />
      <DebugPushNotificationButton />
      {/* Simple reminder debugging info */}
      <div className="mb-2 px-4 py-1 text-xs text-gray-500 flex items-center gap-2">
        <button 
          onClick={() => setShowDebugData(!showDebugData)} 
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

              // Debug log for label
              console.log(`Rendering habit item with label:`, label);

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
