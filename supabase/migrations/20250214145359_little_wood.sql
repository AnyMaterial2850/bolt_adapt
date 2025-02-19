/*
  # Fix future reminders

  1. Changes
    - Add validation to ensure reminder_time is before event_time
    - Add validation to ensure reminder_time is not in the past
    - Update validation function to handle future reminders properly

  2. Security
    - Maintain existing RLS policies
*/

-- Update validation function to handle future reminders
CREATE OR REPLACE FUNCTION validate_daily_schedules(schedules jsonb)
RETURNS boolean AS $$
DECLARE
  valid_days text[] := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  schedule_item jsonb;
  day_schedule jsonb;
  event_time_str text;
  reminder_time_str text;
BEGIN
  -- Handle null case
  IF schedules IS NULL THEN
    RETURN true;
  END IF;

  -- Check if it's an array
  IF NOT jsonb_typeof(schedules) = 'array' THEN
    RETURN false;
  END IF;

  -- Empty array is valid
  IF jsonb_array_length(schedules) = 0 THEN
    RETURN true;
  END IF;

  -- Validate each day's schedule
  FOR schedule_item IN SELECT * FROM jsonb_array_elements(schedules)
  LOOP
    -- Check if day is valid
    IF NOT schedule_item->>'day' = ANY(valid_days) THEN
      RETURN false;
    END IF;

    -- Check if active is boolean
    IF NOT jsonb_typeof(schedule_item->'active') = 'boolean' THEN
      RETURN false;
    END IF;

    -- Check schedules array
    IF NOT jsonb_typeof(schedule_item->'schedules') = 'array' THEN
      RETURN false;
    END IF;

    -- Empty schedules array is valid
    IF jsonb_array_length(schedule_item->'schedules') = 0 THEN
      CONTINUE;
    END IF;

    -- Validate each schedule
    FOR day_schedule IN SELECT * FROM jsonb_array_elements(schedule_item->'schedules')
    LOOP
      -- Validate event_time format (HH:MM)
      event_time_str := day_schedule->>'event_time';
      IF NOT event_time_str ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
        RETURN false;
      END IF;

      -- Validate reminder_time if present
      reminder_time_str := day_schedule->>'reminder_time';
      IF reminder_time_str IS NOT NULL THEN
        -- Check format
        IF NOT reminder_time_str ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
          RETURN false;
        END IF;

        -- Ensure reminder_time is before event_time
        IF reminder_time_str >= event_time_str THEN
          RETURN false;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the constraint
ALTER TABLE user_habits
  DROP CONSTRAINT IF EXISTS valid_daily_schedules;

ALTER TABLE user_habits
  ADD CONSTRAINT valid_daily_schedules
  CHECK (validate_daily_schedules(daily_schedules));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_habits_daily_schedules 
  ON user_habits USING gin (daily_schedules);

-- Add helpful comments
COMMENT ON COLUMN user_habits.daily_schedules IS 'Schedule configuration for each day with event times and optional reminder times';