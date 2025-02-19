-- Create habit_images table
CREATE TABLE habit_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
  path text NOT NULL,
  filename text NOT NULL,
  size integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_path CHECK (path ~ '^habits/'),
  CONSTRAINT valid_file_extension CHECK (filename ~ '\.(jpg|jpeg|png|gif|webp)$'),
  UNIQUE(habit_id, path)
);

-- Enable RLS
ALTER TABLE habit_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view habit images"
  ON habit_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert habit images"
  ON habit_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update habit images"
  ON habit_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete habit images"
  ON habit_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create storage bucket for habit images
INSERT INTO storage.buckets (id, name, public)
VALUES ('habits', 'habits', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'habits');

CREATE POLICY "Allow admin uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'habits' AND
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.uid() = profiles.id AND profiles.is_admin = true
  )
);

CREATE POLICY "Allow admin updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'habits' AND
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.uid() = profiles.id AND profiles.is_admin = true
  )
);

CREATE POLICY "Allow admin deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'habits' AND
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.uid() = profiles.id AND profiles.is_admin = true
  )
);

-- Create indexes
CREATE INDEX habit_images_habit_id_idx ON habit_images(habit_id);
CREATE INDEX habit_images_path_idx ON habit_images(path);
CREATE INDEX habit_images_created_at_idx ON habit_images(created_at DESC);

-- Add helpful comments
COMMENT ON TABLE habit_images IS 'Stores metadata for habit images uploaded to storage';
COMMENT ON COLUMN habit_images.path IS 'Storage path relative to habits/ bucket';
COMMENT ON COLUMN habit_images.filename IS 'Original filename of the uploaded image';
COMMENT ON COLUMN habit_images.size IS 'File size in bytes';
COMMENT ON CONSTRAINT valid_file_extension ON habit_images IS 'Ensures only valid image file extensions are allowed';