-- Create coach-branding bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-branding', 'coach-branding', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for coach-branding bucket
CREATE POLICY "Coach branding is publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'coach-branding');

CREATE POLICY "Authenticated users can upload to coach-branding"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'coach-branding' AND auth.uid() IS NOT NULL);

CREATE POLICY "Coaches can update their own branding"
ON storage.objects FOR UPDATE
USING (bucket_id = 'coach-branding' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can delete their own branding"
ON storage.objects FOR DELETE
USING (bucket_id = 'coach-branding' AND auth.uid()::text = (storage.foldername(name))[1]);