import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getVisionLimit(tier: string | null): number {
  if (tier === "pro" || tier === "premium") return 50;
  return 5; // basic / null / free
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // --- 1. Authenticate user ---
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Token non valido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 2. Determine tier & daily limit ---
    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const dailyLimit = getVisionLimit(profile?.subscription_tier ?? null);

    // --- 3. Check quota from user_ai_usage (date-partitioned) ---
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data: usage } = await adminClient
      .from("user_ai_usage")
      .select("vision_count")
      .eq("user_id", user.id)
      .eq("date", todayStr)
      .maybeSingle();

    const currentCount = usage?.vision_count ?? 0;

    if (currentCount >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: "Daily AI limit reached.",
          code: "DAILY_LIMIT",
          daily_limit: dailyLimit,
          tier: profile?.subscription_tier ?? "basic",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- 4. Parse request body ---
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

    // --- 5. Call AI gateway ---
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
                  : "Analizza questo pasto e stima i macronutrienti.",
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

    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
    }

    const result = JSON.parse(cleaned);

    // --- 6. Increment vision_count atomically ONLY after successful AI response ---
    if (usage) {
      // Row exists for today → increment
      await adminClient
        .from("user_ai_usage")
        .update({ vision_count: currentCount + 1, last_reset: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("date", todayStr);
    } else {
      // No row for today → insert
      await adminClient
        .from("user_ai_usage")
        .insert({ user_id: user.id, date: todayStr, vision_count: 1, last_reset: new Date().toISOString() });
    }

    // Also keep legacy ai_usage_tracking in sync
    const { data: legacyUsage } = await adminClient
      .from("ai_usage_tracking")
      .select("message_count, daily_limit, last_reset_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (legacyUsage) {
      await adminClient
        .from("ai_usage_tracking")
        .update({ message_count: legacyUsage.message_count + 1, daily_limit: dailyLimit })
        .eq("user_id", user.id);
    } else {
      await adminClient
        .from("ai_usage_tracking")
        .insert({ user_id: user.id, message_count: 1, daily_limit: dailyLimit });
    }

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
