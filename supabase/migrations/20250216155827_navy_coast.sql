-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ BEGIN
  -- Drop select policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public Access'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Public Access" ON storage.objects;
  END IF;

  -- Drop insert policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload their own avatars'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can upload their own avatars" ON storage.objects;
  END IF;

  -- Drop update policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update their own avatars'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can update their own avatars" ON storage.objects;
  END IF;

  -- Drop delete policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their own avatars'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can delete their own avatars" ON storage.objects;
  END IF;
END $$;

-- Create new storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add helpful comments
COMMENT ON POLICY "Public Access" ON storage.objects IS 'Allow public access to view avatars';
COMMENT ON POLICY "Users can upload their own avatars" ON storage.objects IS 'Allow users to upload avatars to their own folder';
COMMENT ON POLICY "Users can update their own avatars" ON storage.objects IS 'Allow users to update avatars in their own folder';
COMMENT ON POLICY "Users can delete their own avatars" ON storage.objects IS 'Allow users to delete avatars from their own folder';