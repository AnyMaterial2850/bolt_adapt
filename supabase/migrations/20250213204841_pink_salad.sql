/*
  # Add video support to habits

  1. Changes
    - Add video_url column to habits table
    - Allow NULL values for backward compatibility
    - No changes to existing data or policies required
*/

-- Add video_url column to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS video_url text;