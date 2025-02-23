import { PlanHabitItem } from './PlanHabitItem';
import { format } from 'date-fns';
import type { UserHabit } from '../../types/database';
import { useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';
import confetti from 'canvas-confetti';

interface PlanTabProps {
  habits: UserHabit[];
  onToggleCompletion: (habitId: string, date: Date, eventTime: string) => void;
  completions: Record<string, boolean>;
}

interface LayoutContext {
  selectedDate: Date;
}

export function PlanTab({ habits, onToggleCompletion, completions }: PlanTabProps) {
  const { selectedDate } = useOutletContext<LayoutContext>();
  const [showCelebration, setShowCelebration] = useState(false);
  const { addLog } = useDebugStore();
  const [localHabits, setLocalHabits] = useState(habits);
  const activeHabits = localHabits.filter(h => h.active);

  // Sync habits when prop changes
  useEffect(() => {
    setLocalHabits(habits);
  }, [habits]);

  // Get the day of week (e.g., 'Mon', 'Tue', etc.)
  const currentDay = format(selectedDate, 'EEE');

  // Get all scheduled habits for the day with their times
  const scheduledHabits = activeHabits.flatMap(habit => {
    const daySchedule = habit.daily_schedules.find(s => s.day === currentDay);
    if (!daySchedule?.active) return [];

    return daySchedule.schedules.map(schedule => ({
      habit,
      eventTime: schedule.event_time,
      reminderTime: schedule.reminder_time
    }));
  }).sort((a, b) => {
    // Ensure both times exist before comparing
    if (!a.eventTime || !b.eventTime) return 0;
    return a.eventTime.localeCompare(b.eventTime);
  });

  // Handle reminder toggle
  const handleReminderToggle = async (habitId: string, eventTime: string, newReminderTime: string | null) => {
    try {
      addLog(`${newReminderTime ? 'Adding' : 'Removing'} reminder...`, 'info');

      const habit = localHabits.find(h => h.id === habitId);
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

      // Optimistically update local state
      setLocalHabits(prev => 
        prev.map(h => 
          h.id === habitId
            ? { ...h, daily_schedules: updatedDailySchedules }
            : h
        )
      );

      const { error } = await supabase
        .from('user_habits')
        .update({
          daily_schedules: updatedDailySchedules,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId);

      if (error) {
        // Revert local state on error
        setLocalHabits(prev => 
          prev.map(h => 
            h.id === habitId ? habit : h
          )
        );
        throw error;
      }

      addLog(`Reminder ${newReminderTime ? 'added' : 'removed'} successfully`, 'success');
    } catch (err) {
      console.error('Error updating reminder:', err);
      addLog(`Failed to update reminder: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    }
  };

  // Check if all habits are completed
  useEffect(() => {
    if (scheduledHabits.length === 0) return;

    const allCompleted = scheduledHabits.every(({ habit, eventTime }) => {
      const habitKey = `${habit.id}-${format(selectedDate, 'yyyy-MM-dd')}-${eventTime}`;
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
              const habitKey = `${habit.id}-${format(selectedDate, 'yyyy-MM-dd')}-${eventTime}`;
              const isCompleted = completions[habitKey] || false;

              return (
                <PlanHabitItem
                  key={`${habit.id}-${eventTime}-${index}`}
                  habit={habit}
                  eventTime={eventTime}
                  reminderTime={reminderTime}
                  isCompleted={isCompleted}
                  onToggle={() => onToggleCompletion(habit.id, selectedDate, eventTime)}
                  onReminderToggle={(newReminderTime) => 
                    handleReminderToggle(habit.id, eventTime, newReminderTime)
                  }
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