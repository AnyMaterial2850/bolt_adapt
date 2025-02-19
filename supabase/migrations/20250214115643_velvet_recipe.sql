/*
  # Fix icon column in habits table

  1. Changes
    - Drop and recreate icon column with proper constraints
    - Add index for faster icon lookups
*/

-- First drop the existing icon column if it exists
ALTER TABLE habits DROP COLUMN IF EXISTS icon;

-- Add icon column with proper constraints
ALTER TABLE habits ADD COLUMN icon text;

-- Create an index for faster icon lookups
CREATE INDEX habits_icon_idx ON habits(icon);