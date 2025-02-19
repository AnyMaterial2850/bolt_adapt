-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin deletes" ON storage.objects;

-- Create improved storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'habits');

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'habits' AND
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ))
);

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'habits' AND
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ))
);

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'habits' AND
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ))
);

-- Drop existing habit_images policies
DROP POLICY IF EXISTS "Authenticated users can view habit images" ON habit_images;
DROP POLICY IF EXISTS "Only admins can insert habit images" ON habit_images;
DROP POLICY IF EXISTS "Only admins can update habit images" ON habit_images;
DROP POLICY IF EXISTS "Only admins can delete habit images" ON habit_images;

-- Create improved habit_images policies
CREATE POLICY "View Habit Images"
ON habit_images FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin Insert Habit Images"
ON habit_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin Update Habit Images"
ON habit_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin Delete Habit Images"
ON habit_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add helpful comments
COMMENT ON POLICY "Admin Upload Access" ON storage.objects IS 'Only admin users can upload files';
COMMENT ON POLICY "Admin Update Access" ON storage.objects IS 'Only admin users can update files';
COMMENT ON POLICY "Admin Delete Access" ON storage.objects IS 'Only admin users can delete files';
COMMENT ON POLICY "Admin Insert Habit Images" ON habit_images IS 'Only admin users can insert image metadata';
COMMENT ON POLICY "Admin Update Habit Images" ON habit_images IS 'Only admin users can update image metadata';
COMMENT ON POLICY "Admin Delete Habit Images" ON habit_images IS 'Only admin users can delete image metadata';