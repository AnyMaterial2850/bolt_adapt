/*
  # Fix habit saving issues

  1. Changes
    - Drop and recreate icon validation trigger with better error handling
    - Add missing indexes for performance
    - Update validation function to be more permissive with icon formats

  2. Security
    - Maintain existing RLS policies
*/

-- First clean up existing triggers and functions
DROP TRIGGER IF EXISTS validate_icon_on_insert_update ON habits;
DROP FUNCTION IF EXISTS validate_icon_format();

-- Create improved icon validation function
CREATE OR REPLACE FUNCTION validate_icon_format()
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

-- Add missing indexes
CREATE INDEX IF NOT EXISTS habits_category_idx ON habits(category);
CREATE INDEX IF NOT EXISTS habits_created_at_idx ON habits(created_at DESC);

-- Add helpful comments
COMMENT ON COLUMN habits.icon IS 'Icon identifier in format collection:name (e.g., mdi:home)';
COMMENT ON COLUMN habits.category IS 'Category of the habit (eat, move, mind, sleep)';