-- Create type for bottom line item types
CREATE TYPE bottom_line_item_type AS ENUM ('link', 'image', 'pdf', 'video');

-- Add bottom_line_items column to habits table
ALTER TABLE habits 
ADD COLUMN bottom_line_items jsonb DEFAULT '[]'::jsonb,
DROP COLUMN IF EXISTS bottom_line_title,
DROP COLUMN IF EXISTS bottom_line_url;

-- Create validation function for bottom line items
CREATE OR REPLACE FUNCTION validate_bottom_line_items(items jsonb)
RETURNS boolean AS $$
DECLARE
  valid_days text[] := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  item_record record;
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
  FOR item_record IN 
    SELECT value FROM jsonb_array_elements(items) AS value
  LOOP
    -- Check required fields
    IF NOT (
      item_record.value ? 'title' AND 
      item_record.value ? 'type' AND 
      item_record.value ? 'url'
    ) THEN
      RETURN false;
    END IF;

    -- Validate type
    IF NOT item_record.value->>'type' = ANY(ARRAY['link', 'image', 'pdf', 'video']::text[]) THEN
      RETURN false;
    END IF;

    -- Validate URL format
    IF NOT (item_record.value->>'url' ~ '^https?://') THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add constraint for bottom line items validation
ALTER TABLE habits
  ADD CONSTRAINT valid_bottom_line_items
  CHECK (validate_bottom_line_items(bottom_line_items));

-- Add index for better performance
CREATE INDEX habits_bottom_line_items_idx ON habits USING gin (bottom_line_items);

-- Add helpful comment
COMMENT ON COLUMN habits.bottom_line_items IS 'Array of bottom line items with title, type, and URL';