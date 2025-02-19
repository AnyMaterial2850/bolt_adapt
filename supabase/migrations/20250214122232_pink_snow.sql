/*
  # Icon Support for Habits

  1. Changes
    - Remove video_url column
    - Add icon column with text type
    - Add icon validation function and trigger
    - Add index for icon lookups

  2. Validation
    - Icons must follow format: collection:name (e.g., mdi:home)
    - Null values are allowed
    - Invalid formats will log a warning but not fail
*/

-- First remove the video_url column
ALTER TABLE habits DROP COLUMN IF EXISTS video_url;

-- Add icon column with proper constraints
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon text;

-- Create index for faster icon lookups
DROP INDEX IF EXISTS habits_icon_idx;
CREATE INDEX habits_icon_idx ON habits(icon);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS validate_icon_on_insert_update ON habits;
DROP FUNCTION IF EXISTS validate_icon_format();

-- Create function to validate icon format
CREATE FUNCTION validate_icon_format()
RETURNS trigger AS $$
BEGIN
  -- Allow null values
  IF NEW.icon IS NULL THEN
    RETURN NEW;
  END IF;

  -- More permissive format validation
  IF NEW.icon !~ '^[a-zA-Z0-9-]+:[a-zA-Z0-9-]+[a-zA-Z0-9-]*$' THEN
    RAISE EXCEPTION 'Invalid icon format. Expected format: collection:name';
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but allow the operation to proceed
    RAISE WARNING 'Icon validation failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for icon validation
CREATE TRIGGER validate_icon_on_insert_update
  BEFORE INSERT OR UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION validate_icon_format();

-- Add helpful comments
COMMENT ON COLUMN habits.icon IS 'Icon identifier in format collection:name (e.g., mdi:home)';