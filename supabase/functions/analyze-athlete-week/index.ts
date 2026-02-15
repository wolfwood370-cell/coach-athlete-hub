import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { athlete_id } = await req.json();
    if (!athlete_id) {
      return new Response(JSON.stringify({ error: "athlete_id richiesto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is coach of athlete
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify coach relationship
    const { data: athleteProfile } = await supabase
      .from("profiles")
      .select("coach_id, full_name")
      .eq("id", athlete_id)
      .single();

    if (!athleteProfile || athleteProfile.coach_id !== user.id) {
      return new Response(JSON.stringify({ error: "Accesso negato" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const athleteName = athleteProfile.full_name || "Atleta";

    // Calculate date range (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    // 1. Fetch workout data with VBT metrics
    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select(`
        id, completed_at, rpe_global, srpe, duration_minutes, status,
        workout_exercises (
          exercise_name, mean_velocity_ms, peak_velocity_ms, rom_cm, calc_power_watts, sets_data
        )
      `)
      .eq("athlete_id", athlete_id)
      .gte("completed_at", weekAgo.toISOString())
      .order("completed_at", { ascending: true });

    // 2. Fetch cycle logs
    const { data: cycleLogs } = await supabase
      .from("daily_cycle_logs")
      .select("date, current_phase, symptom_tags, notes")
      .eq("athlete_id", athlete_id)
      .gte("date", weekStart)
      .lte("date", today)
      .order("date", { ascending: true });

    // 3. Fetch readiness data
    const { data: readinessData } = await supabase
      .from("daily_readiness")
      .select("date, score, sleep_quality, energy, mood, stress_level, sleep_hours, body_weight")
      .eq("athlete_id", athlete_id)
      .gte("date", weekStart)
      .lte("date", today)
      .order("date", { ascending: true });

    // Aggregate data for prompt
    const completedWorkouts = (workoutLogs || []).filter((w) => w.status === "completed");
    const totalSessions = completedWorkouts.length;

    // VBT metrics aggregation
    let totalVelocityPoints = 0;
    let sumVelocity = 0;
    let totalVolume = 0;
    const exerciseSummaries: Record<string, { count: number; avgVelocity: number; velocitySum: number }> = {};

    completedWorkouts.forEach((log) => {
      const exercises = log.workout_exercises as Array<{
        exercise_name: string;
        mean_velocity_ms: number | null;
        peak_velocity_ms: number | null;
        sets_data: Array<{ weight_kg?: number; reps?: number }>;
      }>;

      exercises?.forEach((ex) => {
        // Volume
        if (Array.isArray(ex.sets_data)) {
          ex.sets_data.forEach((s) => {
            totalVolume += (Number(s.weight_kg) || 0) * (Number(s.reps) || 0);
          });
        }

        // VBT
        if (ex.mean_velocity_ms && Number(ex.mean_velocity_ms) > 0) {
          const v = Number(ex.mean_velocity_ms);
          sumVelocity += v;
          totalVelocityPoints++;

          if (!exerciseSummaries[ex.exercise_name]) {
            exerciseSummaries[ex.exercise_name] = { count: 0, avgVelocity: 0, velocitySum: 0 };
          }
          exerciseSummaries[ex.exercise_name].count++;
          exerciseSummaries[ex.exercise_name].velocitySum += v;
        }
      });
    });

    // Calculate averages
    Object.keys(exerciseSummaries).forEach((k) => {
      const s = exerciseSummaries[k];
      s.avgVelocity = Math.round((s.velocitySum / s.count) * 1000) / 1000;
    });

    const avgVelocity = totalVelocityPoints > 0 ? Math.round((sumVelocity / totalVelocityPoints) * 1000) / 1000 : null;
    const avgRpe = completedWorkouts.length > 0
      ? Math.round(completedWorkouts.reduce((s, w) => s + (w.rpe_global || 0), 0) / completedWorkouts.length * 10) / 10
      : null;

    // Cycle phase summary
    const cyclePhases = (cycleLogs || []).map((c) => c.current_phase);
    const predominantPhase = cyclePhases.length > 0
      ? cyclePhases.sort((a, b) => cyclePhases.filter((v) => v === a).length - cyclePhases.filter((v) => v === b).length).pop()
      : null;
    const symptoms = (cycleLogs || []).flatMap((c) => c.symptom_tags || []);

    // Readiness summary
    const avgReadiness = readinessData && readinessData.length > 0
      ? Math.round(readinessData.reduce((s, r) => s + (r.score || 0), 0) / readinessData.length)
      : null;
    const avgSleep = readinessData && readinessData.length > 0
      ? Math.round(readinessData.reduce((s, r) => s + (r.sleep_hours || 0), 0) / readinessData.length * 10) / 10
      : null;

    // Build VBT exercise detail string
    const vbtDetail = Object.entries(exerciseSummaries)
      .map(([name, s]) => `${name}: ${s.avgVelocity} m/s media (${s.count} set)`)
      .join("; ");

    // Build the prompt
    const dataContext = `
DATI SETTIMANA (${weekStart} → ${today}) per ${athleteName}:

ALLENAMENTO:
- Sessioni completate: ${totalSessions}
- Volume totale: ${Math.round(totalVolume).toLocaleString()} kg
- RPE medio sessione: ${avgRpe ?? "N/D"}

VBT (Velocity Based Training):
- Velocità media concentrica globale: ${avgVelocity ?? "Nessun dato VBT"} m/s
- Dettaglio per esercizio: ${vbtDetail || "Nessun dato VBT registrato"}

CICLO MESTRUALE:
- Fase predominante: ${predominantPhase ?? "Non tracciato"}
- Sintomi riportati: ${symptoms.length > 0 ? symptoms.join(", ") : "Nessuno"}

READINESS:
- Score medio: ${avgReadiness ?? "N/D"}/100
- Sonno medio: ${avgSleep ?? "N/D"} ore
`.trim();

    const systemPrompt = `Sei un Direttore delle Prestazioni d'élite (Sports Scientist) per un servizio di coaching high-ticket.
Analizzi i dati settimanali degli atleti e produci report concisi, scientifici e azionabili.

REGOLE:
1. Rispondi ESCLUSIVAMENTE in italiano professionale/scientifico.
2. Produci un'analisi breve (3-5 frasi) seguita da esattamente 3 azioni concrete.
3. Se ci sono dati VBT, correla i trend di velocità con il carico e la fase del ciclo.
4. Se la velocità è calata ma il carico è stabile, distingui tra fatica centrale vs periferica.
5. Sii diretto e assertivo nel tono — questo è un report per un coach professionista.
6. NON usare formattazione markdown, solo testo piano.`;

    const userPrompt = `Analizza questi dati e genera:
1. Un paragrafo di analisi (insight_text)  
2. Esattamente 3 azioni concrete (action_items) — ogni azione max 10 parole
3. Un punteggio sentiment da 0.0 (critico) a 1.0 (eccellente)

${dataContext}`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI non configurata" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit the weekly athlete analysis report",
              parameters: {
                type: "object",
                properties: {
                  insight_text: {
                    type: "string",
                    description: "3-5 sentence analysis paragraph in Italian",
                  },
                  action_items: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exactly 3 concrete action items, max 10 words each",
                  },
                  sentiment_score: {
                    type: "number",
                    description: "Score from 0.0 (critical) to 1.0 (excellent)",
                  },
                },
                required: ["insight_text", "action_items", "sentiment_score"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite richieste AI raggiunto. Riprova tra qualche minuto." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti. Contatta il supporto." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "Errore gateway AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis: { insight_text: string; action_items: string[]; sentiment_score: number };

    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      analysis = {
        insight_text: content || "Analisi non disponibile. Dati insufficienti per questa settimana.",
        action_items: ["Raccogliere più dati questa settimana", "Monitorare readiness giornaliera", "Registrare sessioni VBT"],
        sentiment_score: 0.5,
      };
    }

    // Clamp sentiment
    analysis.sentiment_score = Math.max(0, Math.min(1, analysis.sentiment_score));
    // Ensure exactly 3 items
    analysis.action_items = (analysis.action_items || []).slice(0, 3);
    while (analysis.action_items.length < 3) {
      analysis.action_items.push("Monitorare parametri questa settimana");
    }

    // Save to database using service role (bypasses RLS)
    const { data: inserted, error: insertError } = await supabase
      .from("athlete_ai_insights")
      .insert({
        athlete_id,
        coach_id: user.id,
        week_start_date: weekStart,
        insight_text: analysis.insight_text,
        action_items: analysis.action_items,
        sentiment_score: analysis.sentiment_score,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Errore salvataggio analisi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-athlete-week error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
