/*
  # Add activity times to user habits

  1. Changes
    - Add `activity_times` array column to store when habits should be performed
    - Add `reminder_times_minutes` array column to store minutes offset from activity times
    - Remove old `reminder_times` column
    - Add validation function for time arrays

  2. Notes
    - Activity times are stored in 24-hour format (HH:MM)
    - Reminder times are stored as minutes before activity time (e.g., 15 = remind 15 minutes before)
*/

-- First create the new columns with different names to avoid conflicts
ALTER TABLE user_habits 
  ADD COLUMN activity_times time[] DEFAULT ARRAY[]::time[],
  ADD COLUMN reminder_offsets integer[] DEFAULT ARRAY[]::integer[];

-- Create validation function for time arrays
CREATE OR REPLACE FUNCTION validate_time_array(times time[])
RETURNS boolean AS $$
BEGIN
  -- Check if array has any null values
  IF array_position(times, NULL) IS NOT NULL THEN
    RETURN false;
  END IF;
  
  -- Check if times are valid (redundant since PostgreSQL enforces this)
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate activity_times
ALTER TABLE user_habits
  ADD CONSTRAINT valid_activity_times 
  CHECK (validate_time_array(activity_times));

-- Convert any existing reminder times to activity times
DO $$
BEGIN
  -- Set default activity time to 9:00 AM and 15 minutes reminder for existing habits
  UPDATE user_habits 
  SET activity_times = ARRAY['09:00'::time],
      reminder_offsets = ARRAY[15];
END $$;

-- Drop the old reminder_times column
ALTER TABLE user_habits 
  DROP COLUMN reminder_times;

-- Rename reminder_offsets to reminder_times_minutes
ALTER TABLE user_habits 
  RENAME COLUMN reminder_offsets TO reminder_times_minutes;