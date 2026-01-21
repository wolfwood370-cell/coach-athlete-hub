import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface LastSetData {
  weight_kg: number;
  reps: number;
  rpe?: number;
  date: string;
}

export interface ExerciseHistoryMap {
  [exerciseName: string]: LastSetData | null;
}

/**
 * Fetch the most recent completed set data for each exercise name.
 * Returns a map of exercise_name -> last set data (weight, reps, date).
 */
export function useExerciseHistory(exerciseNames: string[], athleteId?: string) {
  const { user } = useAuth();
  const targetUserId = athleteId ?? user?.id;

  return useQuery({
    queryKey: ["exercise-history", targetUserId, exerciseNames.sort().join(",")],
    queryFn: async (): Promise<ExerciseHistoryMap> => {
      if (!targetUserId || exerciseNames.length === 0) {
        return {};
      }

      // Fetch the most recent workout_exercises for each exercise name
      // We need to join with workout_logs to get completed workouts and the date
      const { data: exercises, error } = await supabase
        .from("workout_exercises")
        .select(`
          exercise_name,
          sets_data,
          workout_log_id,
          workout_logs!inner (
            athlete_id,
            status,
            completed_at,
            scheduled_date
          )
        `)
        .in("exercise_name", exerciseNames)
        .eq("workout_logs.athlete_id", targetUserId)
        .eq("workout_logs.status", "completed")
        .order("workout_logs(completed_at)", { ascending: false });

      if (error) {
        console.error("Error fetching exercise history:", error);
        return {};
      }

      if (!exercises || exercises.length === 0) {
        return {};
      }

      // Build a map of exercise_name -> most recent set data
      const historyMap: ExerciseHistoryMap = {};

      for (const ex of exercises) {
        const name = ex.exercise_name;
        
        // Skip if we already have data for this exercise (we want the most recent)
        if (historyMap[name] !== undefined) {
          continue;
        }

        // Parse sets_data to find the best set (highest weight with completed status)
        const setsData = ex.sets_data as Array<{
          weight_kg?: number;
          reps?: number;
          rpe?: number;
          completed?: boolean;
        }> | null;

        if (!setsData || setsData.length === 0) {
          historyMap[name] = null;
          continue;
        }

        // Find the highest weight completed set
        let bestSet: { weight_kg: number; reps: number; rpe?: number } | null = null;

        for (const set of setsData) {
          if (set.completed !== false && set.weight_kg && set.weight_kg > 0) {
            if (!bestSet || set.weight_kg > bestSet.weight_kg) {
              bestSet = {
                weight_kg: set.weight_kg,
                reps: set.reps || 0,
                rpe: set.rpe,
              };
            }
          }
        }

        if (bestSet) {
          const workoutLog = ex.workout_logs as any;
          const date = workoutLog?.completed_at 
            ? new Date(workoutLog.completed_at).toISOString().split("T")[0]
            : workoutLog?.scheduled_date || "";

          historyMap[name] = {
            ...bestSet,
            date,
          };
        } else {
          historyMap[name] = null;
        }
      }

      // Fill in missing exercises with null
      for (const name of exerciseNames) {
        if (historyMap[name] === undefined) {
          historyMap[name] = null;
        }
      }

      return historyMap;
    },
    enabled: !!targetUserId && exerciseNames.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
