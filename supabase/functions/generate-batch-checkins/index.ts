import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Verify the coach
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

    // Verify role
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

    // Fetch all active athletes for this coach
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

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const athleteIds = athletes.map((a) => a.id);

    // Fetch workout data for all athletes in parallel
    const [workoutLogsRes, workoutsRes, nutritionRes] = await Promise.all([
      supabase
        .from("workout_logs")
        .select("athlete_id, completed_at, rpe_global, duration_minutes, total_load_au, status")
        .in("athlete_id", athleteIds)
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabase
        .from("workouts")
        .select("athlete_id, scheduled_date, status")
        .in("athlete_id", athleteIds)
        .gte("scheduled_date", sevenDaysAgoStr),
      supabase
        .from("nutrition_logs")
        .select("athlete_id, calories, protein, carbs, fats, date")
        .in("athlete_id", athleteIds)
        .gte("date", sevenDaysAgoStr),
    ]);

    const workoutLogs = workoutLogsRes.data || [];
    const workouts = workoutsRes.data || [];
    const nutritionLogs = nutritionRes.data || [];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process athletes with concurrency limit
    const CONCURRENCY = 3;
    const results: { athlete_id: string; status: string }[] = [];

    for (let i = 0; i < athletes.length; i += CONCURRENCY) {
      const batch = athletes.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (athlete) => {
          try {
            const athleteLogs = workoutLogs.filter((l) => l.athlete_id === athlete.id);
            const athleteWorkouts = workouts.filter((w) => w.athlete_id === athlete.id);
            const athleteNutrition = nutritionLogs.filter((n) => n.athlete_id === athlete.id);

            const completedCount = athleteLogs.filter((l) => l.status === "completed").length;
            const scheduledCount = athleteWorkouts.length;
            const compliance = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

            const totalVolume = athleteLogs.reduce((sum, l) => sum + (l.total_load_au || 0), 0);
            const avgRpe = athleteLogs.length > 0
              ? (athleteLogs.reduce((sum, l) => sum + (l.rpe_global || 0), 0) / athleteLogs.length).toFixed(1)
              : "N/A";

            const avgCalories = athleteNutrition.length > 0
              ? Math.round(athleteNutrition.reduce((sum, n) => sum + (n.calories || 0), 0) / athleteNutrition.length)
              : null;

            const metricsSnapshot = {
              compliance_pct: compliance,
              total_volume: totalVolume,
              workouts_completed: completedCount,
              workouts_scheduled: scheduledCount,
              avg_rpe: avgRpe,
              avg_daily_calories: avgCalories,
            };

            // Generate AI summary
            const prompt = `Sei un coach sportivo italiano. Analizza questa settimana per ${athlete.full_name || "l'atleta"}.

Dati:
- Compliance allenamenti: ${compliance}% (${completedCount}/${scheduledCount} sessioni)
- Volume totale: ${totalVolume} UA
- RPE medio: ${avgRpe}
- Calorie medie giornaliere: ${avgCalories ? avgCalories + " kcal" : "Non registrate"}

Scrivi un breve report (max 280 caratteri) in italiano. Sii tecnico ma incoraggiante. Evidenzia punti di forza e aree di miglioramento. Non usare emoji.`;

            const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
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
              aiSummary = `Compliance: ${compliance}%. Volume: ${totalVolume} UA. RPE medio: ${avgRpe}.`;
            }

            // Upsert into weekly_checkins
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
