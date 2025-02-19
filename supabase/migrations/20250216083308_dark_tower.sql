/*
  # Fix App Logs Permissions

  1. Changes
    - Add INSERT policy for app_logs table
    - Add better error handling for logging
    - Add index for faster inserts

  2. Security
    - Maintain existing RLS policies
    - Keep admin-only SELECT access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can view logs" ON app_logs;

-- Create improved policies
CREATE POLICY "Only admins can view logs"
  ON app_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Authenticated users can insert logs"
  ON app_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to safely log events
CREATE OR REPLACE FUNCTION log_event(
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO app_logs (
    event_type,
    event_data,
    user_id
  ) VALUES (
    p_event_type,
    p_event_data,
    auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the calling function
    RAISE WARNING 'Failed to log event: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add index for faster inserts
CREATE INDEX IF NOT EXISTS app_logs_insert_idx ON app_logs(event_type, user_id, created_at);

-- Add helpful comments
COMMENT ON FUNCTION log_event IS 'Safely log an event to app_logs table';
COMMENT ON POLICY "Authenticated users can insert logs" ON app_logs IS 'Allow all authenticated users to create log entries';