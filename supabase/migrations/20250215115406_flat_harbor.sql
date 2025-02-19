-- Ensure habits table exists with correct schema
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category habit_category NOT NULL,
  icon text,
  content_type habit_content_type,
  content_url text,
  content_title text,
  content_description text,
  content_thumbnail_url text,
  bottom_line_title text,
  bottom_line_url text,
  go_deeper_titles text[] DEFAULT ARRAY[]::text[],
  go_deeper_urls text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drop and recreate RLS policies for habits table
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view habits" ON habits;
DROP POLICY IF EXISTS "Only admins can modify habits" ON habits;

CREATE POLICY "Authenticated users can view habits"
  ON habits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify habits"
  ON habits FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Add test data if table is empty
INSERT INTO habits (title, description, category)
SELECT 
  'Daily Walk', 
  'Take a 30-minute walk every day', 
  'move'::habit_category
WHERE NOT EXISTS (SELECT 1 FROM habits LIMIT 1);

-- Refresh indexes
DROP INDEX IF EXISTS habits_category_idx;
DROP INDEX IF EXISTS habits_created_at_idx;
CREATE INDEX habits_category_idx ON habits(category);
CREATE INDEX habits_created_at_idx ON habits(created_at DESC);

-- Add helpful comments
COMMENT ON TABLE habits IS 'Stores habit definitions that users can select from';
COMMENT ON COLUMN habits.category IS 'Category of the habit (eat, move, mind, sleep)';