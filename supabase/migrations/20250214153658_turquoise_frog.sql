/*
  # Fix reminder validation and data structure

  1. Changes
    - Update validation function to be more permissive with reminder times
    - Fix data structure for daily schedules
    - Add proper validation for reminder times
    - Add proper error handling

  2. Security
    - Maintain existing RLS policies
*/

-- Update validation function to be more permissive
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
      IF event_time_str IS NULL OR NOT event_time_str ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
        RETURN false;
      END IF;

      -- Validate reminder_time if present
      reminder_time_str := day_schedule->>'reminder_time';
      IF reminder_time_str IS NOT NULL THEN
        -- Check format
        IF NOT reminder_time_str ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
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

-- Add helpful comments
COMMENT ON COLUMN user_habits.daily_schedules IS 'Schedule configuration for each day with event times and optional reminder times';

-- Update existing data to match new format
UPDATE user_habits
SET daily_schedules = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', schedule->>'day',
      'active', COALESCE((schedule->>'active')::boolean, true),
      'schedules', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'event_time', COALESCE(s->>'event_time', s->>'time', '09:00'),
              'reminder_time', 
              CASE 
                WHEN s->>'reminder_time' IS NOT NULL THEN s->>'reminder_time'
                ELSE NULL
              END
            )
          )
          FROM jsonb_array_elements(schedule->'schedules') s
        ),
        jsonb_build_array(
          jsonb_build_object(
            'event_time', '09:00',
            'reminder_time', NULL
          )
        )
      )
    )
  )
  FROM jsonb_array_elements(
    COALESCE(
      daily_schedules,
      jsonb_build_array(
        jsonb_build_object(
          'day', 'Mon',
          'active', true,
          'schedules', jsonb_build_array(jsonb_build_object('event_time', '09:00', 'reminder_time', NULL))
        ),
        jsonb_build_object(
          'day', 'Tue',
          'active', true,
          'schedules', jsonb_build_array(jsonb_build_object('event_time', '09:00', 'reminder_time', NULL))
        ),
        jsonb_build_object(
          'day', 'Wed',
          'active', true,
          'schedules', jsonb_build_array(jsonb_build_object('event_time', '09:00', 'reminder_time', NULL))
        ),
        jsonb_build_object(
          'day', 'Thu',
          'active', true,
          'schedules', jsonb_build_array(jsonb_build_object('event_time', '09:00', 'reminder_time', NULL))
        ),
        jsonb_build_object(
          'day', 'Fri',
          'active', true,
          'schedules', jsonb_build_array(jsonb_build_object('event_time', '09:00', 'reminder_time', NULL))
        ),
        jsonb_build_object(
          'day', 'Sat',
          'active', true,
          'schedules', jsonb_build_array(jsonb_build_object('event_time', '09:00', 'reminder_time', NULL))
        ),
        jsonb_build_object(
          'day', 'Sun',
          'active', true,
          'schedules', jsonb_build_array(jsonb_build_object('event_time', '09:00', 'reminder_time', NULL))
        )
      )
    )
  ) schedule
);