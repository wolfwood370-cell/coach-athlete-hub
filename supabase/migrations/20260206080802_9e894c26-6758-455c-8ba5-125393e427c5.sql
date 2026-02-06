-- Create enum for content types
CREATE TYPE public.content_type AS ENUM ('video', 'pdf', 'link', 'text');

-- Create content library table
CREATE TABLE public.content_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type content_type NOT NULL DEFAULT 'link',
  url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- Coach can do full CRUD on their own content
CREATE POLICY "Coaches can manage their own content"
ON public.content_library
FOR ALL
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- Create index for faster tag searches
CREATE INDEX idx_content_library_tags ON public.content_library USING GIN(tags);

-- Create index for coach_id lookups
CREATE INDEX idx_content_library_coach_id ON public.content_library(coach_id);