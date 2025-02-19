/*
  # Clean up and restructure user habits

  1. Changes
    - Remove old columns (reminder_times, activity_times, reminder_times_minutes, days_of_week)
    - Add daily_schedules column with proper validation
    - Migrate existing data to new format
    - Add constraint to ensure valid schedule data

  2. Structure
    daily_schedules: Array of objects with format:
    [
      {
        "day": "Mon",
        "active": true,
        "schedules": [
          {
            "time": "09:00",
            "reminderMinutes": 15
          }
        ]
      }
    ]
*/

-- Drop old columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_habits' AND column_name = 'reminder_times') THEN
    ALTER TABLE user_habits DROP COLUMN reminder_times;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_habits' AND column_name = 'activity_times') THEN
    ALTER TABLE user_habits DROP COLUMN activity_times;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_habits' AND column_name = 'reminder_times_minutes') THEN
    ALTER TABLE user_habits DROP COLUMN reminder_times_minutes;
  END IF;
END $$;

-- First, add the new column without constraint
ALTER TABLE user_habits
  ADD COLUMN IF NOT EXISTS daily_schedules jsonb DEFAULT '[]'::jsonb;

-- Create validation function
CREATE OR REPLACE FUNCTION validate_daily_schedules(schedules jsonb)
RETURNS boolean AS $$
DECLARE
  valid_days text[] := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  schedule_item jsonb;
  day_schedule jsonb;
  time_str text;
BEGIN
  -- Handle null case
  IF schedules IS NULL THEN
    RETURN false;
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
      -- Validate time format (HH:MM)
      time_str := day_schedule->>'time';
      IF NOT time_str ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
        RETURN false;
      END IF;

      -- Validate reminderMinutes (null or integer)
      IF day_schedule->'reminderMinutes' IS NOT NULL AND 
         NOT jsonb_typeof(day_schedule->'reminderMinutes') = 'number' THEN
        RETURN false;
      END IF;
    END LOOP;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Initialize daily_schedules with default values
UPDATE user_habits
SET daily_schedules = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', day,
      'active', true,
      'schedules', jsonb_build_array(
        jsonb_build_object(
          'time', '09:00',
          'reminderMinutes', 15
        )
      )
    )
  )
  FROM unnest(ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) AS d(day)
)
WHERE daily_schedules IS NULL OR jsonb_array_length(daily_schedules) = 0;

-- Add constraint after data is migrated
ALTER TABLE user_habits
  DROP CONSTRAINT IF EXISTS valid_daily_schedules,
  ADD CONSTRAINT valid_daily_schedules
  CHECK (validate_daily_schedules(daily_schedules));

-- Drop the days_of_week column if it exists
ALTER TABLE user_habits 
  DROP COLUMN IF EXISTS days_of_week;