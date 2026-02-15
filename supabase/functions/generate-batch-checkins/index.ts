import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAYS_IT = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const coachId = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", coachId)
      .single();

    if (profile?.role !== "coach") {
      return new Response(JSON.stringify({ error: "Not a coach" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all active athletes
    const { data: athletes } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("coach_id", coachId)
      .eq("role", "athlete");

    if (!athletes?.length) {
      return new Response(
        JSON.stringify({ message: "No athletes found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Current week: Monday to Sunday
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const todayStr = now.toISOString().split("T")[0];
    const dayName = DAYS_IT[now.getDay()];
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const athleteIds = athletes.map((a) => a.id);

    // Fetch all workout_logs for this week (scheduled + completed + missed)
    const [logsRes, nutritionRes] = await Promise.all([
      supabase
        .from("workout_logs")
        .select("athlete_id, completed_at, rpe_global, duration_minutes, total_load_au, status, scheduled_date, srpe")
        .in("athlete_id", athleteIds)
        .gte("scheduled_date", weekStartStr)
        .lte("scheduled_date", weekEndStr),
      supabase
        .from("nutrition_logs")
        .select("athlete_id, calories, protein, carbs, fats, date")
        .in("athlete_id", athleteIds)
        .gte("date", weekStartStr)
        .lte("date", weekEndStr),
    ]);

    const allLogs = logsRes.data || [];
    const nutritionLogs = nutritionRes.data || [];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const CONCURRENCY = 3;
    const results: { athlete_id: string; status: string }[] = [];

    for (let i = 0; i < athletes.length; i += CONCURRENCY) {
      const batch = athletes.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (athlete) => {
          try {
            const athleteLogs = allLogs.filter((l) => l.athlete_id === athlete.id);
            const athleteNutrition = nutritionLogs.filter((n) => n.athlete_id === athlete.id);

            // Categorize workouts by time
            const completed = athleteLogs.filter((l) => l.status === "completed");
            const missed = athleteLogs.filter(
              (l) => l.status === "missed" || (l.status === "scheduled" && l.scheduled_date && l.scheduled_date < todayStr)
            );
            const remaining = athleteLogs.filter(
              (l) => l.status === "scheduled" && l.scheduled_date && l.scheduled_date >= todayStr
            );

            const completedCount = completed.length;
            const missedCount = missed.length;
            const remainingCount = remaining.length;
            const totalScheduled = completedCount + missedCount + remainingCount;
            const compliance = totalScheduled > 0
              ? Math.round((completedCount / totalScheduled) * 100)
              : 0;

            const totalVolume = completed.reduce((sum, l) => sum + (l.total_load_au || 0), 0);
            const avgRpe = completed.length > 0
              ? (completed.reduce((sum, l) => sum + (l.rpe_global || 0), 0) / completed.length).toFixed(1)
              : "N/A";

            const avgCalories = athleteNutrition.length > 0
              ? Math.round(athleteNutrition.reduce((sum, n) => sum + (n.calories || 0), 0) / athleteNutrition.length)
              : null;

            const metricsSnapshot = {
              compliance_pct: compliance,
              total_volume: totalVolume,
              workouts_completed: completedCount,
              workouts_missed: missedCount,
              workouts_remaining: remainingCount,
              workouts_scheduled: totalScheduled,
              avg_rpe: avgRpe,
              avg_daily_calories: avgCalories,
            };

            // Build time-aware AI prompt
            const weekDoneContext = remainingCount === 0
              ? "La settimana di allenamento è conclusa. Fornisci un riepilogo completo."
              : `Ci sono ancora ${remainingCount} allenament${remainingCount === 1 ? "o" : "i"} in programma. Motiva l'atleta a dare il massimo nelle sessioni rimanenti.`;

            const prompt = `Sei un coach sportivo italiano esperto. Analizza la settimana corrente per ${athlete.full_name || "l'atleta"}.

Contesto temporale: Oggi è ${dayName}, ore ${timeStr}. Settimana dal ${weekStartStr} al ${weekEndStr}.

Dati settimana:
- Allenamenti completati: ${completedCount}
- Allenamenti saltati: ${missedCount}
- Allenamenti ancora in programma: ${remainingCount}
- Compliance attuale: ${compliance}% (${completedCount}/${totalScheduled})
- Volume totale: ${totalVolume} UA
- RPE medio: ${avgRpe}
- Calorie medie giornaliere: ${avgCalories ? avgCalories + " kcal" : "Non registrate"}

${weekDoneContext}

Scrivi un breve report (max 280 caratteri) in italiano. Sii tecnico ma incoraggiante. Non usare emoji.`;

            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.7,
              }),
            });

            let aiSummary = "";
            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              aiSummary = aiData.choices?.[0]?.message?.content?.trim() || "";
            } else {
              console.error("AI error:", aiResponse.status, await aiResponse.text());
              aiSummary = `Compliance: ${compliance}%. Completati: ${completedCount}/${totalScheduled}. Volume: ${totalVolume} UA. RPE medio: ${avgRpe}.`;
            }

            const { error: upsertError } = await supabase
              .from("weekly_checkins")
              .upsert(
                {
                  coach_id: coachId,
                  athlete_id: athlete.id,
                  week_start: weekStartStr,
                  status: "pending",
                  ai_summary: aiSummary,
                  metrics_snapshot: metricsSnapshot,
                },
                { onConflict: "coach_id,athlete_id,week_start" }
              );

            if (upsertError) throw upsertError;

            return { athlete_id: athlete.id, status: "ok" };
          } catch (err) {
            console.error(`Error processing athlete ${athlete.id}:`, err);
            return { athlete_id: athlete.id, status: "error" };
          }
        })
      );

      results.push(...batchResults);
    }

    const successCount = results.filter((r) => r.status === "ok").length;

    return new Response(
      JSON.stringify({
        message: `Analyzed ${successCount}/${athletes.length} athletes`,
        count: successCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Batch checkins error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
