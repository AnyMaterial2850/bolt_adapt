/*
  # Habit Completions Table and Policies

  1. New Tables
    - `habit_completions`
      - `id` (uuid, primary key)
      - `user_habit_id` (uuid, foreign key)
      - `completed_at` (timestamptz)
      - `date` (date)
      - Unique constraint on (user_habit_id, date)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - View their own completions
      - Insert their own completions
      - Delete their own completions

  3. Performance
    - Add index on (user_habit_id, date)
*/

-- Create habit_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id uuid REFERENCES user_habits(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  date date DEFAULT CURRENT_DATE,
  UNIQUE(user_habit_id, date)
);

-- Enable RLS
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop view policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'habit_completions' 
    AND policyname = 'Users can view their own completions'
  ) THEN
    DROP POLICY "Users can view their own completions" ON habit_completions;
  END IF;

  -- Drop insert policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'habit_completions' 
    AND policyname = 'Users can insert their own completions'
  ) THEN
    DROP POLICY "Users can insert their own completions" ON habit_completions;
  END IF;

  -- Drop delete policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'habit_completions' 
    AND policyname = 'Users can delete their own completions'
  ) THEN
    DROP POLICY "Users can delete their own completions" ON habit_completions;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Users can view their own completions"
  ON habit_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE user_habits.id = habit_completions.user_habit_id
      AND user_habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own completions"
  ON habit_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE user_habits.id = habit_completions.user_habit_id
      AND user_habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own completions"
  ON habit_completions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE user_habits.id = habit_completions.user_habit_id
      AND user_habits.user_id = auth.uid()
    )
  );

-- Drop index if it exists and recreate it
DROP INDEX IF EXISTS habit_completions_user_habit_id_date_idx;
CREATE INDEX habit_completions_user_habit_id_date_idx ON habit_completions(user_habit_id, date);