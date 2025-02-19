/*
  # Initial Schema Setup for Adapt Health App

  1. New Tables
    - `profiles`
      - Extended user profile information
      - Stores goals and other user-specific data
    - `habits`
      - Pre-defined habits that admins can create
      - Includes content and category information
    - `user_habits`
      - Links users to their selected habits
      - Stores configuration and progress
    - `habit_completions`
      - Tracks daily habit completion
    - `chat_messages`
      - Stores chat history between users and AI

  2. Security
    - Enable RLS on all tables
    - Policies for user access to their own data
    - Admin policies for managing habits
*/

-- Create enum for habit categories
CREATE TYPE habit_category AS ENUM ('eat', 'move', 'mind', 'sleep');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  is_admin boolean DEFAULT false,
  goal_what text,
  goal_why text,
  goal_timeline timestamp with time zone,
  coaching_notes text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create habits table (managed by admins)
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category habit_category NOT NULL,
  content text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user_habits table (user's selected habits and their configuration)
CREATE TABLE IF NOT EXISTS user_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
  frequency_per_day integer DEFAULT 1,
  reminder_times time[] DEFAULT ARRAY[]::time[],
  active boolean DEFAULT true,
  days_of_week text[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, habit_id)
);

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id uuid REFERENCES user_habits(id) ON DELETE CASCADE,
  completed_at timestamp with time zone DEFAULT now(),
  date date DEFAULT CURRENT_DATE
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_ai boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Habits policies (viewable by all authenticated users, modifiable by admins)
CREATE POLICY "All users can view habits"
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

-- User habits policies
CREATE POLICY "Users can view their own habits"
  ON user_habits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own habits"
  ON user_habits FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Habit completions policies
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

CREATE POLICY "Users can manage their own completions"
  ON habit_completions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE user_habits.id = habit_completions.user_habit_id
      AND user_habits.user_id = auth.uid()
    )
  );

-- Chat messages policies
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to handle user deletion (GDPR compliance)
CREATE OR REPLACE FUNCTION delete_user_data(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all user data
  DELETE FROM chat_messages WHERE user_id = user_id;
  DELETE FROM habit_completions 
    WHERE user_habit_id IN (SELECT id FROM user_habits WHERE user_id = user_id);
  DELETE FROM user_habits WHERE user_id = user_id;
  DELETE FROM profiles WHERE id = user_id;
END;
$$;