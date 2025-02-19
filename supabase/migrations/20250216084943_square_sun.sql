-- Drop existing function
DROP FUNCTION IF EXISTS schedule_habit_reminders(uuid, date, time, time);

-- Create improved function with simpler time handling
CREATE OR REPLACE FUNCTION schedule_habit_reminders(
  p_user_habit_id uuid,
  p_date date,
  p_event_time time,
  p_reminder_time time
)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_habit_id uuid;
  v_scheduled_for timestamptz;
BEGIN
  -- Validate parameters
  IF p_user_habit_id IS NULL THEN
    RAISE EXCEPTION 'User habit ID is required';
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Date is required';
  END IF;

  IF p_event_time IS NULL THEN
    RAISE EXCEPTION 'Event time is required';
  END IF;

  IF p_reminder_time IS NULL THEN
    RAISE EXCEPTION 'Reminder time is required';
  END IF;

  -- Validate time formats (HH:MM only)
  IF NOT p_event_time::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Invalid event time format. Expected HH:MM';
  END IF;

  IF NOT p_reminder_time::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Invalid reminder time format. Expected HH:MM';
  END IF;

  -- Get user_id and habit_id
  SELECT user_id, habit_id INTO v_user_id, v_habit_id
  FROM user_habits
  WHERE id = p_user_habit_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User habit not found';
  END IF;

  -- Calculate reminder time (truncate to minutes)
  v_scheduled_for := date_trunc('minute', (p_date + p_reminder_time)::timestamptz);

  -- Ensure reminder is before event
  IF p_reminder_time >= p_event_time THEN
    RAISE EXCEPTION 'Reminder time must be before event time';
  END IF;

  -- Delete any existing reminders for this event
  DELETE FROM reminders
  WHERE user_habit_id = p_user_habit_id
    AND date_trunc('minute', scheduled_for::timestamptz) = date_trunc('minute', v_scheduled_for)
    AND date_trunc('minute', event_time::time) = date_trunc('minute', p_event_time);

  -- Create new reminder
  INSERT INTO reminders (
    user_id,
    habit_id,
    user_habit_id,
    scheduled_for,
    event_time
  ) VALUES (
    v_user_id,
    v_habit_id,
    p_user_habit_id,
    v_scheduled_for,
    p_event_time
  );

  -- Log the reminder creation
  PERFORM log_event(
    'reminder_scheduled',
    jsonb_build_object(
      'user_habit_id', p_user_habit_id,
      'date', p_date,
      'event_time', p_event_time,
      'reminder_time', p_reminder_time,
      'scheduled_for', v_scheduled_for
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION schedule_habit_reminders IS 'Schedule a reminder for a habit with HH:MM time format and minute-level precision';