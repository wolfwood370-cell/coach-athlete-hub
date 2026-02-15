import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface VbtDataPoint {
  id: string;
  date: string;
  dateFormatted: string;
  exerciseName: string;
  meanVelocity: number;
  peakVelocity: number;
  romCm: number | null;
  powerWatts: number | null;
  weightKg: number;
  estimated1RM: number;
  workoutLogId: string;
}

interface SetData {
  weight_kg?: number;
  reps?: number;
}

export function useAthleteVbtData(athleteId: string | undefined, exerciseFilter?: string) {
  return useQuery({
    queryKey: ["athlete-vbt", athleteId, exerciseFilter],
    queryFn: async () => {
      if (!athleteId) return [];

      const query = supabase
        .from("workout_exercises")
        .select(`
          id,
          exercise_name,
          mean_velocity_ms,
          peak_velocity_ms,
          rom_cm,
          calc_power_watts,
          sets_data,
          workout_log_id,
          workout_logs!inner (
            completed_at,
            athlete_id
          )
        `)
        .eq("workout_logs.athlete_id", athleteId)
        .not("mean_velocity_ms", "is", null)
        .order("created_at", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const points: VbtDataPoint[] = [];

      data?.forEach((row) => {
        const log = row.workout_logs as unknown as { completed_at: string | null };
        if (!log?.completed_at) return;

        const sets = row.sets_data as SetData[] | null;
        let bestWeight = 0;
        if (Array.isArray(sets)) {
          sets.forEach((s) => {
            const w = Number(s.weight_kg) || 0;
            if (w > bestWeight) bestWeight = w;
          });
        }

        const meanV = Number(row.mean_velocity_ms) || 0;
        const peakV = Number(row.peak_velocity_ms) || 0;
        if (meanV <= 0) return;

        // Filter by exercise if specified
        if (exerciseFilter && !row.exercise_name.toLowerCase().includes(exerciseFilter.toLowerCase())) {
          return;
        }

        const date = new Date(log.completed_at);
        const reps = Array.isArray(sets) ? sets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0) : 0;
        const est1RM = bestWeight > 0 && reps > 0 ? bestWeight * (1 + 0.0333 * reps) : bestWeight;

        points.push({
          id: row.id,
          date: log.completed_at,
          dateFormatted: format(date, "dd/MM"),
          exerciseName: row.exercise_name,
          meanVelocity: Math.round(meanV * 1000) / 1000,
          peakVelocity: Math.round(peakV * 1000) / 1000,
          romCm: row.rom_cm ? Math.round(Number(row.rom_cm) * 10) / 10 : null,
          powerWatts: row.calc_power_watts ? Math.round(Number(row.calc_power_watts)) : null,
          weightKg: bestWeight,
          estimated1RM: Math.round(est1RM * 10) / 10,
          workoutLogId: row.workout_log_id,
        });
      });

      return points;
    },
    enabled: !!athleteId,
  });
}

export function useAthleteVbtExercises(athleteId: string | undefined) {
  return useQuery({
    queryKey: ["athlete-vbt-exercises", athleteId],
    queryFn: async () => {
      if (!athleteId) return [];

      const { data, error } = await supabase
        .from("workout_exercises")
        .select(`
          exercise_name,
          workout_logs!inner (athlete_id)
        `)
        .eq("workout_logs.athlete_id", athleteId)
        .not("mean_velocity_ms", "is", null);

      if (error) throw error;

      const names = new Set<string>();
      data?.forEach((r) => {
        if (r.exercise_name) names.add(r.exercise_name);
      });

      return Array.from(names).sort();
    },
    enabled: !!athleteId,
  });
}
