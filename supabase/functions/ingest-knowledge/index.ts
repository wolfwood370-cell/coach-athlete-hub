import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Split text into chunks of ~500 tokens (~2000 chars) with overlap
function chunkText(text: string, chunkSize = 2000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = end - overlap;
  }
  return chunks.filter((c) => c.length > 20); // skip tiny fragments
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI embedding error:", response.status, errorText);
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, metadata, file_url } = await req.json();

    let rawText = content as string | undefined;

    // If a file URL is provided, fetch the text content
    if (file_url && !rawText) {
      const fileResp = await fetch(file_url);
      if (!fileResp.ok) throw new Error("Impossibile scaricare il file");
      rawText = await fileResp.text();
    }

    if (!rawText || rawText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Nessun contenuto fornito" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chunks = chunkText(rawText);
    const baseMeta = metadata || {};

    // Process chunks in batches of 5 to avoid rate limits
    const batchSize = 5;
    let insertedCount = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const embeddings = await Promise.all(
        batch.map((chunk) => getEmbedding(chunk, openaiKey))
      );

      const rows = batch.map((chunk, idx) => ({
        coach_id: user.id,
        content: chunk,
        metadata: { ...baseMeta, chunk_index: i + idx, total_chunks: chunks.length },
        embedding: JSON.stringify(embeddings[idx]),
      }));

      const { error: insertError } = await supabase
        .from("coach_knowledge_base")
        .insert(rows);

      if (insertError) {
        console.error("Insert error at batch", i, insertError);
        throw insertError;
      }

      insertedCount += batch.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunks_created: insertedCount,
        message: `${insertedCount} chunk(s) indicizzati con successo.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ingest-knowledge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
