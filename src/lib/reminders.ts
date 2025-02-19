import { supabase } from './supabase';
import { showNotification } from './notifications';
import { useDebugStore } from '../stores/debugStore';
import { format, parse } from 'date-fns';

// Schedule a reminder for a habit
export async function scheduleReminder(
  userHabitId: string,
  date: Date,
  eventTime: string,
  reminderTime: string
) {
  const { addLog } = useDebugStore.getState();
  
  try {
    addLog(`Scheduling reminder for habit ${userHabitId}...`, 'info');
    addLog(`Input times - Event: ${eventTime}, Reminder: ${reminderTime}`, 'info');

    // Format date as YYYY-MM-DD
    const formattedDate = format(date, 'yyyy-MM-dd');

    // Parse times and ensure they're valid
    let parsedEventTime: Date;
    let parsedReminderTime: Date;

    try {
      // Parse input times (expected format: HH:mm)
      parsedEventTime = parse(eventTime, 'HH:mm', new Date());
      parsedReminderTime = parse(reminderTime, 'HH:mm', new Date());
    } catch (err) {
      addLog('Failed to parse times', 'error');
      throw new Error('Invalid time format. Expected HH:mm');
    }

    // Ensure reminder is before event
    if (parsedReminderTime >= parsedEventTime) {
      addLog('Reminder time must be before event time', 'error');
      throw new Error('Reminder time must be before event time');
    }

    // Format times as HH:MM for database
    const formattedEventTime = format(parsedEventTime, 'HH:mm');
    const formattedReminderTime = format(parsedReminderTime, 'HH:mm');

    addLog(`Formatted times - Event: ${formattedEventTime}, Reminder: ${formattedReminderTime}`, 'info');

    // Schedule the reminder
    const { error } = await supabase.rpc('schedule_habit_reminders', {
      p_user_habit_id: userHabitId,
      p_date: formattedDate,
      p_event_time: formattedEventTime,
      p_reminder_time: formattedReminderTime
    });

    if (error) {
      addLog(`Failed to schedule reminder: ${error.message}`, 'error');
      throw error;
    }

    addLog('Reminder scheduled successfully', 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to schedule reminder';
    addLog(message, 'error');
    throw err;
  }
}

// Check for upcoming reminders
export async function checkUpcomingReminders() {
  const { addLog } = useDebugStore.getState();

  try {
    addLog('Checking for upcoming reminders...', 'info');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      addLog('No authenticated user found', 'error');
      return;
    }

    // Get upcoming reminders
    const { data: reminders, error } = await supabase.rpc('get_upcoming_reminders', {
      p_minutes_ahead: 5,
      p_user_id: user.id
    });

    if (error) throw error;

    // Show notifications for each reminder
    for (const reminder of reminders) {
      // Format time for display
      const formattedTime = format(parse(reminder.event_time, 'HH:mm', new Date()), 'h:mm a');
      
      showNotification(
        `Reminder: ${reminder.habit_title}`,
        {
          body: `Your habit "${reminder.habit_title}" is scheduled for ${formattedTime}`,
          tag: `habit-${reminder.user_habit_id}-${reminder.scheduled_for}`,
          data: {
            habitId: reminder.habit_id,
            userHabitId: reminder.user_habit_id,
            eventTime: reminder.event_time
          }
        }
      );

      // Mark reminder as sent
      await supabase
        .from('reminders')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', reminder.id);
    }

    if (reminders.length > 0) {
      addLog(`Sent ${reminders.length} reminders`, 'success');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check reminders';
    addLog(message, 'error');
    throw err;
  }
}

// Start reminder check interval
export function startReminderChecks(intervalMinutes = 1) {
  const { addLog } = useDebugStore.getState();
  addLog('Starting reminder checks...', 'info');

  // Check immediately
  checkUpcomingReminders();

  // Set up interval
  const interval = setInterval(checkUpcomingReminders, intervalMinutes * 60 * 1000);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    addLog('Stopped reminder checks', 'info');
  };
}