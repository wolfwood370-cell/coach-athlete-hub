## Goal

Route all AI edge function calls back through the **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) using `LOVABLE_API_KEY`, eliminating direct OpenAI billing for chat/generation/analysis. Embeddings (`text-embedding-3-small`) stay on OpenAI directly — the gateway is for chat completions only.

## Model routing

| Function | New Model | Reason |
|---|---|---|
| `generate-program` | `openai/gpt-5.2` | Highest reasoning for program design |
| `analyze-athlete-week` | `openai/gpt-5-mini` | Cost-effective structured summarization |
| `chat-with-coach` | `openai/gpt-5-mini` | Cost-effective streaming chat |
| `analyze-meal-photo` | `google/gemini-3-flash-preview` | Fast multimodal vision (already on gateway, model swap from `gemini-2.5-flash`) |

## Changes per function

### 1. `supabase/functions/generate-program/index.ts`
- Replace `OPENAI_API_KEY` env read with `LOVABLE_API_KEY`.
- Change endpoint from `https://api.openai.com/v1/chat/completions` to `https://ai.gateway.lovable.dev/v1/chat/completions`.
- Change `model: "gpt-4o-mini"` → `"openai/gpt-5.2"`.
- Update missing-key error message to reference the gateway.
- Keep tool-calling (`submit_program`) and 429/402 handling intact.

### 2. `supabase/functions/analyze-athlete-week/index.ts`
- Same swap pattern: `OPENAI_API_KEY` → `LOVABLE_API_KEY`, endpoint → gateway, `model` → `"openai/gpt-5-mini"`.
- Keep `submit_analysis` tool-call + sentiment-clamp logic + DB insert unchanged.

### 3. `supabase/functions/chat-with-coach/index.ts`
- Keep `OPENAI_API_KEY` (still needed for `getEmbedding` → `text-embedding-3-small`).
- Add a separate `LOVABLE_API_KEY` env read for the chat call.
- Change chat endpoint to gateway, `model: "gpt-4o-mini"` → `"openai/gpt-5-mini"`.
- Streaming SSE response and quota-tracking logic unchanged.

### 4. `supabase/functions/analyze-meal-photo/index.ts`
- Already uses Lovable Gateway + `LOVABLE_API_KEY`. Only swap model from `"google/gemini-2.5-flash"` to `"google/gemini-3-flash-preview"`.

## Out of scope (intentionally untouched)
- Embeddings in `chat-with-coach` and `ingest-knowledge` continue to call OpenAI directly (`text-embedding-3-small`) — the Lovable Gateway is chat-completions only.
- No changes to RLS, schema, frontend, quota tables, or `supabase/config.toml`.

## Verification
After deploy I'll confirm each function compiles (no TS errors in Deno) and report back the routing summary. No client code needs updates — function contracts are identical.
