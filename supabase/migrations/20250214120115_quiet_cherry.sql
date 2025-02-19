/*
  # Fix icon handling in habits table

  1. Changes
    - Drop and recreate icon column with proper validation
    - Add index for performance
    - Add trigger for format validation

  2. Validation
    - Ensures icon format is collection:name
    - Allows null values
    - Validates on insert and update
*/

-- First ensure we have a clean slate
DROP TRIGGER IF EXISTS validate_icon_on_insert_update ON habits;
DROP FUNCTION IF EXISTS validate_icon_format();
ALTER TABLE habits DROP COLUMN IF EXISTS icon;

-- Add icon column with proper constraints
ALTER TABLE habits ADD COLUMN icon text;

-- Create index for faster icon lookups
CREATE INDEX habits_icon_idx ON habits(icon);

-- Create function to validate icon format
CREATE OR REPLACE FUNCTION validate_icon_format()
RETURNS trigger AS $$
BEGIN
  -- Allow null values
  IF NEW.icon IS NULL THEN
    RETURN NEW;
  END IF;

  -- Basic format validation (collection:name)
  IF NEW.icon !~ '^[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid icon format. Expected format: collection:name';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for icon validation
CREATE TRIGGER validate_icon_on_insert_update
  BEFORE INSERT OR UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION validate_icon_format();

-- Add comment to explain icon format
COMMENT ON COLUMN habits.icon IS 'Icon identifier in format collection:name (e.g., mdi:home)';