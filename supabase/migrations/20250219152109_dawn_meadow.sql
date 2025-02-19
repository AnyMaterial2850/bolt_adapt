/*
  # Habit Frequency Schema Update

  1. New Types and Columns
    - habit_frequency enum for frequency types
    - frequency_details JSONB for flexible configuration
    - frequency_validation function
  
  2. Changes
    - Add new columns to habits table
    - Add validation constraints
    - Update existing habits with default frequency
  
  3. Security
    - Maintain existing RLS policies
*/

-- Create habit frequency enum
CREATE TYPE habit_frequency AS ENUM (
  'daily',
  'days_per_week', 
  'times_per_week',
  'after_meals',
  'times_per_day',
  'specific_times'
);

-- Add frequency columns to habits table
ALTER TABLE habits
  ADD COLUMN frequency habit_frequency DEFAULT 'daily',
  ADD COLUMN frequency_details jsonb DEFAULT '{}'::jsonb;

-- Create frequency validation function
CREATE OR REPLACE FUNCTION validate_frequency_details(
  p_frequency habit_frequency,
  p_details jsonb
)
RETURNS boolean AS $$
BEGIN
  -- Handle null case
  IF p_details IS NULL THEN
    RETURN true;
  END IF;

  -- Validate based on frequency type
  CASE p_frequency
    WHEN 'daily' THEN
      RETURN jsonb_typeof(p_details) = 'object';
      
    WHEN 'days_per_week' THEN
      RETURN (
        jsonb_typeof(p_details->>'days') = 'array' AND
        jsonb_array_length(p_details->'days') > 0 AND
        jsonb_array_length(p_details->'days') <= 7
      );
      
    WHEN 'times_per_week' THEN
      RETURN (
        (p_details->>'target')::int > 0 AND
        (p_details->>'target')::int <= 7 AND
        (p_details->>'minimum_rest_days')::int >= 0
      );
      
    WHEN 'after_meals' THEN
      RETURN (
        jsonb_typeof(p_details->>'meals') = 'array' AND
        jsonb_array_length(p_details->'meals') > 0 AND
        (p_details->>'window')::jsonb ? 'minutes_after' AND
        (p_details->>'window')::jsonb ? 'duration_minutes'
      );
      
    WHEN 'times_per_day' THEN
      RETURN (
        (p_details->>'target')::int > 0 AND
        (p_details->>'minimum_interval_minutes')::int > 0
      );
      
    WHEN 'specific_times' THEN
      RETURN (
        jsonb_typeof(p_details->>'times') = 'array' AND
        jsonb_array_length(p_details->'times') > 0 AND
        (p_details->>'flexible_window_minutes')::int >= 0
      );
      
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add validation constraint
ALTER TABLE habits
  ADD CONSTRAINT valid_frequency_details
  CHECK (validate_frequency_details(frequency, frequency_details));

-- Update existing habits with default frequency
UPDATE habits SET
  frequency = 'daily',
  frequency_details = '{}'::jsonb
WHERE frequency IS NULL;

-- Add helpful comments
COMMENT ON COLUMN habits.frequency IS 'Type of habit frequency (daily, days_per_week, etc.)';
COMMENT ON COLUMN habits.frequency_details IS 'JSON configuration for the frequency type';