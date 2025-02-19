/*
  # Add icon column to habits table

  1. Changes
    - Add `icon` column to habits table to store Iconify icon identifiers
    - Make it nullable since not all habits will have custom icons
*/

-- Add icon column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon text;