/*
  # Fix habit completions

  1. Changes
    - Drop existing unique constraint
    - Add new unique constraint for user_habit_id, date, and event_time
    - Update indexes for better performance
    - Add validation for completion dates

  2. Security
    - Maintain existing RLS policies
    - Add date validation to prevent future completions
*/

-- Drop existing unique constraint if it exists
ALTER TABLE habit_completions 
  DROP CONSTRAINT IF EXISTS habit_completions_user_habit_id_date_event_time_key;

-- Add new unique constraint
ALTER TABLE habit_completions 
  ADD CONSTRAINT habit_completions_user_habit_id_date_event_time_key 
  UNIQUE (user_habit_id, date, event_time);

-- Drop existing indexes
DROP INDEX IF EXISTS habit_completions_user_habit_id_date_event_time_idx;
DROP INDEX IF EXISTS habit_completions_user_habit_id_date_idx;

-- Create new indexes for better performance
CREATE INDEX habit_completions_user_habit_id_date_event_time_idx 
  ON habit_completions(user_habit_id, date, event_time);

CREATE INDEX habit_completions_date_idx 
  ON habit_completions(date);

-- Create function to validate completion date
CREATE OR REPLACE FUNCTION validate_completion_date()
RETURNS trigger AS $$
BEGIN
  -- Prevent completions for future dates
  IF NEW.date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot complete habits for future dates';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for date validation
DROP TRIGGER IF EXISTS validate_completion_date_trigger ON habit_completions;
CREATE TRIGGER validate_completion_date_trigger
  BEFORE INSERT OR UPDATE ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION validate_completion_date();

-- Add helpful comments
COMMENT ON TABLE habit_completions IS 'Tracks habit completions with unique constraint on user_habit_id, date, and event_time';
COMMENT ON COLUMN habit_completions.date IS 'Date of completion (cannot be in the future)';
COMMENT ON COLUMN habit_completions.event_time IS 'Scheduled time of the habit event';