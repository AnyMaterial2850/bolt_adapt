import { parse } from 'date-fns';

export function validateReminderTime(eventTime: string, reminderTime: string): string | null {
  // Validate time format (HH:MM)
  if (!reminderTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
    return 'Invalid time format. Expected HH:MM';
  }

  const reminderDate = parse(reminderTime, 'HH:mm', new Date());
  const eventDate = parse(eventTime, 'HH:mm', new Date());

  if (!reminderDate || !eventDate) {
    return 'Invalid time format';
  }

  if (reminderDate >= eventDate) {
    return 'Reminder time must be before event time';
  }

  return null;
}