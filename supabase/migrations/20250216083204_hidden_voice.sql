/*
  # Fix Reminders Function

  1. Changes
    - Drop and recreate get_upcoming_reminders function with fixed parameter order
    - Add better error handling
    - Add logging

  2. Security
    - Maintain RLS policies
    - Keep existing security constraints
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_upcoming_reminders(int, uuid);
DROP FUNCTION IF EXISTS get_upcoming_reminders(uuid, int);

-- Create improved function with better parameter handling
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
  -- Validate parameters
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  IF p_minutes_ahead < 1 OR p_minutes_ahead > 60 THEN
    RAISE EXCEPTION 'Minutes ahead must be between 1 and 60';
  END IF;

  -- Return upcoming reminders
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
    AND (now() + (p_minutes_ahead || ' minutes')::interval)
  ORDER BY r.scheduled_for ASC;

  -- Log function execution
  INSERT INTO app_logs (
    event_type,
    event_data,
    user_id
  ) VALUES (
    'get_upcoming_reminders',
    jsonb_build_object(
      'minutes_ahead', p_minutes_ahead,
      'user_id', p_user_id
    ),
    p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create app_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on app_logs
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for app_logs
CREATE POLICY "Only admins can view logs"
  ON app_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS app_logs_event_type_idx ON app_logs(event_type);
CREATE INDEX IF NOT EXISTS app_logs_user_id_idx ON app_logs(user_id);
CREATE INDEX IF NOT EXISTS app_logs_created_at_idx ON app_logs(created_at DESC);

-- Add helpful comments
COMMENT ON FUNCTION get_upcoming_reminders IS 'Get upcoming reminders for a user within the specified time window';
COMMENT ON TABLE app_logs IS 'Audit logs for application events';
COMMENT ON COLUMN app_logs.event_type IS 'Type of event being logged';
COMMENT ON COLUMN app_logs.event_data IS 'Additional data about the event in JSON format';