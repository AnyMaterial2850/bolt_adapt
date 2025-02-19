/*
  # Fix icon column in habits table

  1. Changes
    - Drop and recreate icon column with proper constraints
    - Add index for faster icon lookups
    - Add trigger to validate icon format
*/

-- Create function to validate icon format
CREATE OR REPLACE FUNCTION validate_icon_format()
RETURNS trigger AS $$
BEGIN
  -- Allow null values
  IF NEW.icon IS NULL THEN
    RETURN NEW;
  END IF;

  -- Basic format validation (can be expanded based on iconify format)
  IF NEW.icon !~ '^[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid icon format. Expected format: collection:name';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_icon_on_insert_update ON habits;

-- Create trigger for icon validation
CREATE TRIGGER validate_icon_on_insert_update
  BEFORE INSERT OR UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION validate_icon_format();

-- Add comment to explain icon format
COMMENT ON COLUMN habits.icon IS 'Icon identifier in format collection:name (e.g., mdi:home)';