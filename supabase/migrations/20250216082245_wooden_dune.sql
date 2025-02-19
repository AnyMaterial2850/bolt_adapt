/*
  # Fix Reminders System

  1. Changes
    - Drop and recreate reminders table with proper constraints
    - Add RLS policies for security
    - Create functions for scheduling and retrieving reminders
    - Add indexes for performance

  2. Security
    - Enable RLS on reminders table
    - Add policies for authenticated users to manage their own reminders
*/

-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS get_upcoming_reminders(int, uuid);
DROP FUNCTION IF EXISTS schedule_habit_reminders(uuid, date, time, time);
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can manage their own reminders" ON reminders;

-- Drop and recreate reminders table
DROP TABLE IF EXISTS reminders;
CREATE TABLE reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
  user_habit_id uuid REFERENCES user_habits(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  event_time time NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_habit_id, scheduled_for, event_time)
);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own reminders"
  ON reminders FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to schedule reminders
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
  -- Get user_id and habit_id
  SELECT user_id, habit_id INTO v_user_id, v_habit_id
  FROM user_habits
  WHERE id = p_user_habit_id;

  -- Calculate reminder time
  v_scheduled_for := (p_date + p_reminder_time)::timestamptz;

  -- Delete any existing reminders for this event
  DELETE FROM reminders
  WHERE user_habit_id = p_user_habit_id
    AND scheduled_for::date = p_date
    AND event_time = p_event_time;

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
END;
$$ LANGUAGE plpgsql;

-- Create function to get upcoming reminders
CREATE OR REPLACE FUNCTION get_upcoming_reminders(
  p_minutes_ahead int DEFAULT 5,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  habit_id uuid,
  user_habit_id uuid,
  scheduled_for timestamptz,
  event_time time,
  habit_title text,
  habit_description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.habit_id,
    r.user_habit_id,
    r.scheduled_for,
    r.event_time,
    h.title,
    h.description
  FROM reminders r
  JOIN habits h ON h.id = r.habit_id
  WHERE r.user_id = p_user_id
    AND r.sent_at IS NULL
    AND r.scheduled_for BETWEEN now() 
    AND (now() + (p_minutes_ahead || ' minutes')::interval);
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX reminders_user_id_idx ON reminders(user_id);
CREATE INDEX reminders_scheduled_for_idx ON reminders(scheduled_for);
CREATE INDEX reminders_sent_at_idx ON reminders(sent_at);

-- Add helpful comments
COMMENT ON TABLE reminders IS 'Stores scheduled reminders for habits';
COMMENT ON COLUMN reminders.scheduled_for IS 'When the reminder should be sent';
COMMENT ON COLUMN reminders.event_time IS 'The time of the actual habit event';
COMMENT ON COLUMN reminders.sent_at IS 'When the reminder was actually sent';