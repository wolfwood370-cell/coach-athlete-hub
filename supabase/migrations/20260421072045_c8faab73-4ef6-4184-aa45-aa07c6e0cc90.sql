-- Restrict listing of public buckets to owners only.
-- Public file FETCHES still work via the CDN/public URL; this only blocks `.list()` enumeration.

DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Coach branding is publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Food photos are publicly readable" ON storage.objects;

CREATE POLICY "Coaches can list own avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'coach-avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can list own logos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'coach-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can list own branding"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'coach-branding' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can list own food photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'food-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);