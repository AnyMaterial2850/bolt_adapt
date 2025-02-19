/*
  # Analytics Schema

  1. New Tables
    - `user_habit_analytics`
      - Stores aggregated analytics data per user habit
      - Includes completion scores, time block performance, patterns
    - `user_habit_time_blocks`
      - Stores time-based performance tracking
      - Links to user_habits and completions

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Add policies for admin access

  3. Indexes
    - Optimized for common queries
    - Support for time-series analysis
*/

-- Create user_habit_analytics table
CREATE TABLE user_habit_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id uuid REFERENCES user_habits(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  completion_score numeric(5,2) NOT NULL DEFAULT 0,
  completion_trend numeric(5,2) NOT NULL DEFAULT 0,
  best_time_block jsonb,
  worst_time_block jsonb,
  day_of_week_pattern jsonb,
  seasonal_pattern jsonb,
  analysis_period tstzrange NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_completion_score CHECK (completion_score >= 0 AND completion_score <= 100),
  CONSTRAINT valid_completion_trend CHECK (completion_trend >= -100 AND completion_trend <= 100)
);

-- Create user_habit_time_blocks table
CREATE TABLE user_habit_time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id uuid REFERENCES user_habits(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  time_block tstzrange NOT NULL,
  completion_count integer NOT NULL DEFAULT 0,
  total_scheduled integer NOT NULL DEFAULT 0,
  success_rate numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100),
  CONSTRAINT valid_counts CHECK (completion_count >= 0 AND total_scheduled >= completion_count)
);

-- Enable RLS
ALTER TABLE user_habit_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habit_time_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_habit_analytics
CREATE POLICY "Users can view their own analytics"
  ON user_habit_analytics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only system can insert analytics"
  ON user_habit_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only system can update analytics"
  ON user_habit_analytics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for user_habit_time_blocks
CREATE POLICY "Users can view their own time blocks"
  ON user_habit_time_blocks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only system can insert time blocks"
  ON user_habit_time_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only system can update time blocks"
  ON user_habit_time_blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX user_habit_analytics_user_habit_id_idx ON user_habit_analytics(user_habit_id);
CREATE INDEX user_habit_analytics_user_id_idx ON user_habit_analytics(user_id);
CREATE INDEX user_habit_analytics_analysis_period_idx ON user_habit_analytics USING GIST (analysis_period);
CREATE INDEX user_habit_analytics_updated_at_idx ON user_habit_analytics(updated_at);

CREATE INDEX user_habit_time_blocks_user_habit_id_idx ON user_habit_time_blocks(user_habit_id);
CREATE INDEX user_habit_time_blocks_user_id_idx ON user_habit_time_blocks(user_id);
CREATE INDEX user_habit_time_blocks_time_block_idx ON user_habit_time_blocks USING GIST (time_block);
CREATE INDEX user_habit_time_blocks_updated_at_idx ON user_habit_time_blocks(updated_at);

-- Add helpful comments
COMMENT ON TABLE user_habit_analytics IS 'Stores aggregated analytics data for user habits';
COMMENT ON TABLE user_habit_time_blocks IS 'Stores time-based performance tracking for user habits';