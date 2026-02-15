import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sprout, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { subDays } from "date-fns";

interface DataSeederProps {
  athleteId: string;
}

const SEED_SESSIONS = [
  {
    daysAgo: 7,
    title: "Squat Day – Fresh",
    rpe: 6,
    exercises: [
      { name: "Back Squat", velocity: 0.85, peak: 1.1, rom: 42, power: 620, sets: [{ weight_kg: 100, reps: 5 }, { weight_kg: 100, reps: 5 }, { weight_kg: 100, reps: 5 }] },
      { name: "Romanian Deadlift", velocity: 0.7, peak: 0.9, rom: 35, power: 480, sets: [{ weight_kg: 80, reps: 8 }, { weight_kg: 80, reps: 8 }] },
    ],
  },
  {
    daysAgo: 4,
    title: "Squat Day – Accumulation",
    rpe: 8,
    exercises: [
      { name: "Back Squat", velocity: 0.65, peak: 0.88, rom: 40, power: 550, sets: [{ weight_kg: 100, reps: 5 }, { weight_kg: 100, reps: 4 }, { weight_kg: 100, reps: 4 }] },
      { name: "Leg Press", velocity: null, peak: null, rom: null, power: null, sets: [{ weight_kg: 180, reps: 10 }, { weight_kg: 180, reps: 10 }] },
    ],
  },
  {
    daysAgo: 1,
    title: "Squat Day – Fatigue",
    rpe: 9,
    exercises: [
      { name: "Back Squat", velocity: 0.35, peak: 0.52, rom: 38, power: 380, sets: [{ weight_kg: 100, reps: 3 }, { weight_kg: 100, reps: 2 }, { weight_kg: 100, reps: 2 }] },
      { name: "Bulgarian Split Squat", velocity: null, peak: null, rom: null, power: null, sets: [{ weight_kg: 30, reps: 8 }, { weight_kg: 30, reps: 8 }] },
    ],
  },
];

export function DataSeeder({ athleteId }: DataSeederProps) {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);

    try {
      // Get current user as coach
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Devi essere autenticato per inserire dati.");
        return;
      }

      for (const session of SEED_SESSIONS) {
        const sessionDate = subDays(new Date(), session.daysAgo);
        const completedAt = sessionDate.toISOString();
        const scheduledDate = sessionDate.toISOString().split("T")[0];

        // 1. Create workout record
        const { data: workout, error: workoutErr } = await supabase
          .from("workouts")
          .insert({
            athlete_id: athleteId,
            coach_id: user.id,
            title: session.title,
            scheduled_date: scheduledDate,
            status: "completed" as any,
            structure: [],
          })
          .select("id")
          .single();

        if (workoutErr) {
          console.error("Workout insert error:", workoutErr);
          toast.error(`Errore creazione workout: ${workoutErr.message}`);
          return;
        }

        // 2. Create workout_log
        const durationMin = 55 + Math.floor(Math.random() * 20);
        const srpe = session.rpe * durationMin;

        const { data: log, error: logErr } = await supabase
          .from("workout_logs")
          .insert({
            athlete_id: athleteId,
            workout_id: workout.id,
            status: "completed",
            started_at: completedAt,
            completed_at: completedAt,
            duration_minutes: durationMin,
            rpe_global: session.rpe,
            srpe,
            exercises_data: [],
            scheduled_date: scheduledDate,
          })
          .select("id")
          .single();

        if (logErr) {
          console.error("Log insert error:", logErr);
          toast.error(`Errore creazione log: ${logErr.message}`);
          return;
        }

        // 3. Create workout_exercises with VBT data
        for (let i = 0; i < session.exercises.length; i++) {
          const ex = session.exercises[i];
          const { error: exErr } = await supabase
            .from("workout_exercises")
            .insert({
              workout_log_id: log.id,
              exercise_name: ex.name,
              exercise_order: i + 1,
              mean_velocity_ms: ex.velocity,
              peak_velocity_ms: ex.peak,
              rom_cm: ex.rom,
              calc_power_watts: ex.power,
              sets_data: ex.sets,
            });

          if (exErr) {
            console.error("Exercise insert error:", exErr);
            toast.error(`Errore inserimento esercizio: ${exErr.message}`);
            return;
          }
        }
      }

      // 4. Insert readiness data
      for (let daysAgo = 7; daysAgo >= 1; daysAgo--) {
        const date = subDays(new Date(), daysAgo).toISOString().split("T")[0];
        const fatigueRamp = Math.max(0, 1 - (7 - daysAgo) * 0.12);
        const score = Math.round(40 + fatigueRamp * 50);

        await supabase.from("daily_readiness").insert({
          athlete_id: athleteId,
          date,
          score,
          sleep_quality: Math.round(2 + fatigueRamp * 3),
          energy: Math.round(2 + fatigueRamp * 3),
          mood: Math.round(2 + fatigueRamp * 3),
          stress_level: Math.round(5 - fatigueRamp * 3),
          sleep_hours: 6 + Math.round(fatigueRamp * 2 * 10) / 10,
          body_weight: 75 + Math.round(Math.random() * 10) / 10,
        });
      }

      toast.success("Storico allenamenti generato", {
        description: "L'AI ora ha dati da analizzare. Clicca 'Genera Analisi'.",
      });
    } catch (err) {
      console.error("Seed error:", err);
      toast.error("Errore durante il seeding dei dati.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSeed}
      disabled={isSeeding}
      className="gap-1.5 border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground"
    >
      {isSeeding ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sprout className="h-3.5 w-3.5" />
      )}
      {isSeeding ? "Inserimento..." : "🌱 Seed Dati Test"}
    </Button>
  );
}
