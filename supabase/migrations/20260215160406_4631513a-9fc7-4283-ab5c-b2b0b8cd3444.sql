
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create coach knowledge base table
CREATE TABLE public.coach_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own knowledge base
CREATE POLICY "Coaches can insert own documents"
  ON public.coach_knowledge_base FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can view own documents"
  ON public.coach_knowledge_base FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own documents"
  ON public.coach_knowledge_base FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own documents"
  ON public.coach_knowledge_base FOR DELETE
  USING (auth.uid() = coach_id);

-- Athletes can read their coach's knowledge base
CREATE POLICY "Athletes can view coach documents"
  ON public.coach_knowledge_base FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'athlete'
        AND profiles.coach_id = coach_knowledge_base.coach_id
    )
  );

-- HNSW index for fast cosine similarity search
CREATE INDEX idx_coach_knowledge_base_embedding
  ON public.coach_knowledge_base
  USING hnsw (embedding vector_cosine_ops);

-- Search function: match documents by cosine similarity
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536),
  p_coach_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    ckb.id,
    ckb.content,
    ckb.metadata,
    1 - (ckb.embedding <=> query_embedding) AS similarity
  FROM coach_knowledge_base ckb
  WHERE ckb.coach_id = p_coach_id
    AND 1 - (ckb.embedding <=> query_embedding) > match_threshold
  ORDER BY ckb.embedding <=> query_embedding
  LIMIT match_count;
$$;
