import { format } from 'date-fns';
import type { UserHabit } from '../../types/database';
import { useOutletContext } from 'react-router-dom';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';
import { useHabitStore } from '../../stores/habitStore';
import { useAuthStore } from '../../stores/authStore';
import confetti from 'canvas-confetti';
import { PlanTabPresentation } from './PlanTabPresentation';


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
  const { user } = useAuthStore();

  const [showDebugData, setShowDebugData] = useState(false);

  const activeHabits = useMemo(() =>
    habits.filter(h => h.active === true),
    [habits]
  );

  const currentDay = useMemo(() =>
    format(selectedDate, 'EEE'),
    [selectedDate]
  );

  const scheduledHabits = useMemo(() => {
    const habitItems = activeHabits.flatMap(habit => {
      const daySchedule = habit.daily_schedules?.find(s => s.day === currentDay);
      if (!daySchedule?.active) return [];
      return daySchedule.schedules.map(schedule => ({
        habit,
        eventTime: schedule.event_time,
        reminderTime: schedule.reminder_time,
        label: schedule.label
      }));
    }).sort((a, b) => {
      const getBaseTime = (time: string) => time.split('-')[0];
      const baseTimeA = getBaseTime(a.eventTime);
      const baseTimeB = getBaseTime(b.eventTime);
      const baseTimeComparison = baseTimeA.localeCompare(baseTimeB);
      if (baseTimeComparison !== 0) return baseTimeComparison;
      if (a.eventTime.includes('-') && b.eventTime.includes('-')) {
        const indexA = parseInt(a.eventTime.split('-')[1]);
        const indexB = parseInt(b.eventTime.split('-')[1]);
        return indexA - indexB;
      }
      return 0;
    });
    return habitItems;
  }, [activeHabits, currentDay, habits]); // Added habits as a dependency to ensure updates

  // Import the habit store to force reload after updates
  const { loadUserHabits } = useHabitStore();

  const handleReminderToggle = useCallback(async (habitId: string, eventTime: string, newReminderTime: string | null): Promise<void> => {
    try {
      addLog(`${newReminderTime ? 'Adding' : 'Removing'} reminder...`, 'info');
      const habit = habits.find(h => h.id === habitId);
      if (!habit) throw new Error('Habit not found');
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
      
      // Force reload user habits to update the UI
      if (user?.id) {
        await loadUserHabits(user.id);
      }
      
      addLog(`Reminder ${newReminderTime ? 'added' : 'removed'} successfully`, 'success');
    } catch (err) {
      console.error('Error updating reminder:', err);
      addLog(`Failed to update reminder: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    }
  }, [habits, currentDay, addLog, loadUserHabits, user]);

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
    <PlanTabPresentation
      scheduledHabits={scheduledHabits}
      completions={completions}
      selectedDate={selectedDate}
      currentDay={currentDay}
      showCelebration={showCelebration}
      showDebugData={showDebugData}
      onToggleDebugData={() => setShowDebugData(!showDebugData)}
      onToggleCompletion={onToggleCompletion}
      onReminderToggle={handleReminderToggle}
    />
  );
}
