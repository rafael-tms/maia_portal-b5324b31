-- Allow public access to images bucket
-- This policy allows all operations for the 'images' bucket.

-- Ensure the bucket exists first (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policy if it exists to avoid conflicts or just create if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Images' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access to Images"
        ON storage.objects FOR ALL
        USING ( bucket_id = 'images' )
        WITH CHECK ( bucket_id = 'images' );
    END IF;
END
$$;
