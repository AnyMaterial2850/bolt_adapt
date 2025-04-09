import { useEffect, useRef, useState } from 'react';
import { requestNotificationPermission } from '../lib/notification';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

// Reminder type
interface Reminder {
  id: string;
  title: string;
  reminderTime: string; // 'HH:mm' format
  habitId: string;
  habitTitle: string;
  category: string;
  target?: number[];
  unit?: string;
}

// Helper to parse 'HH:mm' into Date object for today
function parseTimeToToday(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

export function useReminderNotifications() {
  const { user } = useAuthStore();
  const notifiedReminders = useRef<Set<string>>(new Set());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Fetch user's reminders from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchReminders = async () => {
      try {
        // Get user habits with reminders
        const { data, error } = await supabase
          .from('user_habits')
          .select(`
            id,
            habit_id,
            daily_schedules,
            habit:habits (
              id,
              title,
              category,
              target,
              unit
            )
          `)
          .eq('user_id', user.id)
          .eq('active', true);

        if (error) throw error;

        // Transform data into reminders
        const todayReminders: Reminder[] = [];
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayName = dayNames[today.getDay()];

        data.forEach(userHabit => {
          // Find today's schedule
          const todaySchedule = userHabit.daily_schedules.find(
            (schedule: any) => schedule.day === todayName && schedule.active
          );

          if (todaySchedule && todaySchedule.schedules) {
            // Add each reminder time
            todaySchedule.schedules.forEach((schedule: any, index: number) => {
              if (schedule.reminder_time) {
                todayReminders.push({
                  id: `${userHabit.id}-${index}`,
                  title: `Time for: ${userHabit.habit.title}`,
                  reminderTime: schedule.reminder_time,
                  habitId: userHabit.habit_id,
                  habitTitle: userHabit.habit.title,
                  category: userHabit.habit.category,
                  target: userHabit.habit.target,
                  unit: userHabit.habit.unit
                });
              }
            });
          }
        });

        setReminders(todayReminders);
      } catch (err: unknown) {
        console.error('Error fetching reminders:', err);
      }
    };

    fetchReminders();
    
    // Refresh reminders every hour
    const refreshInterval = setInterval(fetchReminders, 60 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  // Request notification permission and set up reminder checking
  useEffect(() => {
    // Request permission
    requestNotificationPermission()
      .then(() => {
        setPermissionGranted(true);
        console.log('Notification permission granted');
      })
      .catch((err: unknown) => {
        console.warn('Notification permission denied or error:', err);
      });

    // Check for reminders that need to be triggered
    const checkInterval = setInterval(() => {
      if (!permissionGranted) return;

      const now = new Date();

      reminders.forEach((reminder) => {
        const reminderDate = parseTimeToToday(reminder.reminderTime);
        const diffMs = reminderDate.getTime() - now.getTime();

        // Trigger if within past 60 seconds and not yet notified
        if (diffMs <= 0 && diffMs > -60000 && !notifiedReminders.current.has(reminder.id)) {
          // Format target and unit if available
          let targetText = '';
          if (reminder.target && reminder.target.length > 0 && reminder.unit) {
            targetText = ` (Target: ${reminder.target.join(', ')} ${reminder.unit})`;
          }

          // Show native notification
          if ('Notification' in window) {
            new Notification(reminder.title, {
              body: `${reminder.habitTitle}${targetText}`,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: reminder.id,
              requireInteraction: true
            });
          }
          
          notifiedReminders.current.add(reminder.id);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [permissionGranted, reminders]);

  return { permissionGranted, remindersCount: reminders.length };
}
