

## Piano: Passare a GPT-4o-mini per le risposte AI

### Cosa cambia

Tutte e 3 le Edge Function che attualmente usano il Lovable AI Gateway (`google/gemini-3-flash-preview`) verranno modificate per chiamare direttamente l'API OpenAI (`https://api.openai.com/v1/chat/completions`) con il modello `gpt-4o-mini`, usando la chiave `OPENAI_API_KEY` gia' configurata.

Gli embeddings (`text-embedding-3-small`) restano invariati.

### Funzioni da modificare

**1. `chat-with-coach/index.ts`** (Chat AI con streaming)
- Sostituire la chiamata al Lovable AI Gateway con l'API OpenAI diretta
- Modello: `gpt-4o-mini`
- Mantenere lo streaming SSE
- Rimuovere la dipendenza da `LOVABLE_API_KEY` (in questa funzione)
- Aggiornare la gestione errori (429/402) per il formato OpenAI

**2. `generate-program/index.ts`** (Generazione programmi)
- Stessa sostituzione: OpenAI diretta con `gpt-4o-mini`
- Mantenere il tool calling (`submit_program`)
- Usare `OPENAI_API_KEY` al posto di `LOVABLE_API_KEY`

**3. `analyze-athlete-week/index.ts`** (Report settimanali)
- Stessa sostituzione: OpenAI diretta con `gpt-4o-mini`
- Mantenere il tool calling (`submit_analysis`)
- Usare `OPENAI_API_KEY` al posto di `LOVABLE_API_KEY`

### Dettagli tecnici

In ogni funzione, il blocco:
```typescript
const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${lovableKey}` },
  body: JSON.stringify({ model: "google/gemini-3-flash-preview", ... }),
});
```

Diventa:
```typescript
const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
  headers: { Authorization: `Bearer ${openaiKey}` },
  body: JSON.stringify({ model: "gpt-4o-mini", ... }),
});
```

### Impatto costi
- **Prima:** Embeddings su OpenAI + Chat su Lovable AI (gratuito incluso)
- **Dopo:** Tutto su OpenAI (embeddings + chat + programmi + analisi) -- i costi dipendono interamente dal tuo piano OpenAI
- `gpt-4o-mini` e' economico (~$0.15/1M input tokens, ~$0.60/1M output tokens)

### Nessuna modifica richiesta
- Database / RLS
- Frontend / UI
- Embeddings (`text-embedding-3-small`)

