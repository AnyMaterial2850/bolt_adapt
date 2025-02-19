/*
  # Add content sections to habits table

  1. Changes
    - Add bottom_line_title and bottom_line_url columns for "The Bottom Line" section
    - Add go_deeper array columns for multiple "Go Deeper" entries
    - Each "Go Deeper" entry will have a title and URL

  2. Notes
    - Using arrays to store multiple go_deeper entries
    - All new columns are nullable
*/

-- Add bottom line columns
ALTER TABLE habits ADD COLUMN IF NOT EXISTS bottom_line_title text;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS bottom_line_url text;

-- Add go deeper columns using arrays to store multiple entries
ALTER TABLE habits ADD COLUMN IF NOT EXISTS go_deeper_titles text[] DEFAULT ARRAY[]::text[];
ALTER TABLE habits ADD COLUMN IF NOT EXISTS go_deeper_urls text[] DEFAULT ARRAY[]::text[];