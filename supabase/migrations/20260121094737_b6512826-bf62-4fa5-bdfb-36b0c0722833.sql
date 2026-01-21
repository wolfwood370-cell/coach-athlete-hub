-- Fix Security Issue: chat-media storage bucket security
-- Issue: Unrestricted uploads without folder ownership validation

-- ============================================
-- 1. Make the bucket private (require signed URLs for access)
-- ============================================
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-media';

-- ============================================
-- 2. Drop existing overly permissive policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;

-- ============================================
-- 3. Create secure storage policies with folder ownership validation
-- ============================================

-- Users can only upload to their own folder (videos/{user_id}/...)
CREATE POLICY "Users can upload to their own folder"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[1] = 'videos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can view media they uploaded OR media in rooms they participate in
-- For simplicity and security, we restrict to: own uploads + uploads by chat participants in shared rooms
CREATE POLICY "Users can view chat media in their conversations"
ON storage.objects 
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media' AND
  (
    -- User can always view their own uploads
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- User can view uploads from other users they share a chat room with
    EXISTS (
      SELECT 1 FROM chat_participants my_participation
      INNER JOIN chat_participants other_participation 
        ON my_participation.room_id = other_participation.room_id
      WHERE my_participation.user_id = auth.uid()
        AND other_participation.user_id::text = (storage.foldername(name))[2]
    )
  )
);

-- Users can only delete their own media
CREATE POLICY "Users can delete their own chat media"
ON storage.objects 
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can update their own media (e.g., metadata)
CREATE POLICY "Users can update their own chat media"
ON storage.objects 
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[2] = auth.uid()::text
);