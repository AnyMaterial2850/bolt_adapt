/*
  # Add content columns to habits table

  1. New Columns
    - `content_type` (text) - Type of content (pdf, ppt, image, video, link)
    - `content_url` (text) - URL to the content
    - `content_title` (text) - Title of the content
    - `content_description` (text) - Description of the content
    - `content_thumbnail_url` (text) - URL to content thumbnail (for videos/images)

  2. Changes
    - Add validation for content_type values
    - Add validation for URLs
    - Add indexes for better performance

  3. Security
    - Maintain existing RLS policies
*/

-- Create enum for content types
CREATE TYPE habit_content_type AS ENUM ('pdf', 'ppt', 'image', 'video', 'link');

-- Add content columns
ALTER TABLE habits
  ADD COLUMN content_type habit_content_type,
  ADD COLUMN content_url text,
  ADD COLUMN content_title text,
  ADD COLUMN content_description text,
  ADD COLUMN content_thumbnail_url text;

-- Create function to validate URLs
CREATE OR REPLACE FUNCTION is_valid_url(url text)
RETURNS boolean AS $$
BEGIN
  RETURN url ~ '^https?:\/\/.+';
END;
$$ LANGUAGE plpgsql;

-- Add URL validation constraints
ALTER TABLE habits
  ADD CONSTRAINT valid_content_url 
    CHECK (content_url IS NULL OR is_valid_url(content_url)),
  ADD CONSTRAINT valid_thumbnail_url 
    CHECK (content_thumbnail_url IS NULL OR is_valid_url(content_thumbnail_url));

-- Add indexes for better performance
CREATE INDEX habits_content_type_idx ON habits(content_type);
CREATE INDEX habits_content_url_idx ON habits(content_url);

-- Add helpful comments
COMMENT ON COLUMN habits.content_type IS 'Type of content (pdf, ppt, image, video, link)';
COMMENT ON COLUMN habits.content_url IS 'URL to the content';
COMMENT ON COLUMN habits.content_title IS 'Title of the content';
COMMENT ON COLUMN habits.content_description IS 'Description of the content';
COMMENT ON COLUMN habits.content_thumbnail_url IS 'URL to content thumbnail (for videos/images)';