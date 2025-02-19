/*
  # Update habit scheduling

  1. Changes
    - Add event_time column to daily schedules to separate event time from reminder time
    - Update validation function to handle new schema
    - Migrate existing data to new format

  2. Schema Update
    - daily_schedules JSON structure will now be:
      {
        day: string,
        active: boolean,
        schedules: [
          {
            event_time: string (HH:MM),
            reminder_time: string (HH:MM) | null
          }
        ]
      }
*/

-- Update validation function
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
      time_str := day_schedule->>'event_time';
      IF NOT time_str ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
        RETURN false;
      END IF;

      -- Validate reminder_time if present
      time_str := day_schedule->>'reminder_time';
      IF time_str IS NOT NULL AND NOT time_str ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
        RETURN false;
      END IF;
    END LOOP;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing data
UPDATE user_habits
SET daily_schedules = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', schedule->>'day',
      'active', (schedule->>'active')::boolean,
      'schedules', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'event_time', s->>'time',
            'reminder_time',
            CASE
              WHEN (s->>'reminderMinutes')::int IS NOT NULL THEN
                to_char(
                  (
                    to_timestamp((s->>'time'), 'HH24:MI') - 
                    ((s->>'reminderMinutes')::int || ' minutes')::interval
                  )::time,
                  'HH24:MI'
                )
              ELSE NULL
            END
          )
        )
        FROM jsonb_array_elements(schedule->'schedules') s
      )
    )
  )
  FROM jsonb_array_elements(daily_schedules) schedule
)
WHERE jsonb_typeof(daily_schedules) = 'array';

-- Add constraint back
ALTER TABLE user_habits
  DROP CONSTRAINT IF EXISTS valid_daily_schedules,
  ADD CONSTRAINT valid_daily_schedules
  CHECK (validate_daily_schedules(daily_schedules));