import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, userDescription } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "Nessuna immagine fornita" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Ensure proper data URL format
    const imageUrl = image_base64.startsWith("data:")
      ? image_base64
      : `data:image/jpeg;base64,${image_base64}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Sei un Nutrizionista Sportivo esperto. Analizza l'immagine del cibo fornita.
Stima i macronutrienti con la massima accuratezza possibile.
Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura:
{ "name": "string (nome del piatto in ITALIANO)", "calories": number, "protein": number, "carbs": number, "fat": number, "confidence_score": number (da 0 a 1) }

Se l'immagine NON contiene cibo, restituisci: { "error": "Non è cibo" }

Regole:
- Il nome deve essere in italiano
- Le calorie e i macros devono essere numeri interi
- Il confidence_score indica quanto sei sicuro della stima (0.0 = incerto, 1.0 = molto sicuro)
- Considera le porzioni visibili nell'immagine
- NON aggiungere testo, spiegazioni o markdown. Solo il JSON.`,
          },
           {
            role: "user",
            content: [
              { 
                type: "text", 
                text: userDescription 
                  ? `Analizza questo pasto e stima i macronutrienti. L'utente ha fornito questo contesto aggiuntivo: "${userDescription}". Usa queste informazioni per affinare le porzioni e gli ingredienti. Se l'utente specifica una quantità (es. "200g"), dai priorità a quella rispetto alla tua stima visiva.`
                  : "Analizza questo pasto e stima i macronutrienti." 
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppe richieste, riprova tra poco." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Errore nel servizio AI");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Nessuna risposta dall'AI");
    }

    // Parse the JSON from the AI response (strip markdown code fences if present)
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
    }

    const result = JSON.parse(cleaned);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-meal-photo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
