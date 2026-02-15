
-- Add ai_knowledge to content_type enum
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'ai_knowledge';

-- Create storage bucket for AI knowledge documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-knowledge-docs', 'ai-knowledge-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Coaches can upload their own files
CREATE POLICY "Coaches can upload AI docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-knowledge-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Coaches can read their own files
CREATE POLICY "Coaches can read own AI docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ai-knowledge-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Coaches can delete their own files
CREATE POLICY "Coaches can delete own AI docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ai-knowledge-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
