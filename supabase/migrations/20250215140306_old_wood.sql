-- Drop existing constraint if it exists
ALTER TABLE habits DROP CONSTRAINT IF EXISTS valid_bottom_line_items;

-- Create or replace validation function for bottom line items
CREATE OR REPLACE FUNCTION validate_bottom_line_items(items jsonb)
RETURNS boolean AS $$
BEGIN
  -- Handle null case
  IF items IS NULL THEN
    RETURN true;
  END IF;

  -- Check if it's an array
  IF NOT jsonb_typeof(items) = 'array' THEN
    RETURN false;
  END IF;

  -- Empty array is valid
  IF jsonb_array_length(items) = 0 THEN
    RETURN true;
  END IF;

  -- Validate each item
  RETURN (
    SELECT bool_and(
      (value ? 'title')
      AND (value ? 'type')
      AND (value ? 'url')
      AND (value->>'type' = ANY(ARRAY['link', 'image', 'pdf', 'video']::text[]))
      AND (value->>'url' ~ '^https?://')
    )
    FROM jsonb_array_elements(items)
  );
END;
$$ LANGUAGE plpgsql;

-- Add constraint back
ALTER TABLE habits
  ADD CONSTRAINT valid_bottom_line_items
  CHECK (validate_bottom_line_items(bottom_line_items));

-- Initialize empty bottom line items array for existing records
UPDATE habits 
SET bottom_line_items = '[]'::jsonb 
WHERE bottom_line_items IS NULL;

-- Add helpful comment
COMMENT ON COLUMN habits.bottom_line_items IS 'Array of bottom line items with title, type, url and optional description';