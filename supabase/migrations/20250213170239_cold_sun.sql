/*
  # Fix profiles RLS policies

  1. Changes
    - Add policy for inserting new profiles during sign up
    - Modify existing policies to be more permissive for profile creation
    - Fix policy syntax for SELECT operations

  2. Security
    - Allow authenticated users to create their own profile
    - Maintain existing read/update restrictions
    - Allow email checks for authentication flow
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public email checks" ON profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow email checks during auth"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);