import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import {
  parseWorkoutStructure,
  type WorkoutStructureExercise,
} from "@/types/database";

const FIVE_MINUTES = 5 * 60 * 1000;

type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
type WorkoutLogStatus = Database["public"]["Tables"]["workout_logs"]["Row"]["status"];
type WorkoutBaseStatus = Database["public"]["Tables"]["workouts"]["Row"]["status"];

export interface TodayWorkout {
  id: string;
  title: string;
  description?: string | null;
  estimatedDuration: number | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  exerciseCount: number;
  programWorkoutId?: string | null;
  structure: WorkoutStructureExercise[];
}

/** Slim shape returned by the embedded `workouts (...)` join in workout_logs. */
type EmbeddedWorkout = Pick<
  WorkoutRow,
  "id" | "title" | "description" | "estimated_duration" | "structure"
>;

export function useTodaysWorkout() {
  const { user } = useAuth();
  const athleteId = user?.id ?? null;
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["athlete-today-workout", athleteId, today],
    queryFn: async (): Promise<TodayWorkout | null> => {
      if (!athleteId) return null;

      // Check workout_logs for scheduled workouts (from program)
      const { data: logs } = await supabase
        .from("workout_logs")
        .select(`
          id,
          status,
          program_workout_id,
          workouts (
            id,
            title,
            description,
            estimated_duration,
            structure
          )
        `)
        .eq("athlete_id", athleteId)
        .eq("scheduled_date", today)
        .in("status", ["scheduled", "completed"])
        .limit(1)
        .maybeSingle();

      if (logs?.workouts) {
        const w = logs.workouts as EmbeddedWorkout;
        const structure = parseWorkoutStructure(w.structure);
        const logStatus = logs.status as WorkoutLogStatus;
        return {
          id: w.id,
          title: w.title,
          description: w.description,
          estimatedDuration: w.estimated_duration,
          status: logStatus === "scheduled" ? "pending" : "completed",
          exerciseCount: structure.length,
          programWorkoutId: logs.program_workout_id,
          structure,
        };
      }

      // Fallback to workouts table
      const { data: workout } = await supabase
        .from("workouts")
        .select("id, title, description, estimated_duration, structure, status")
        .eq("athlete_id", athleteId)
        .eq("scheduled_date", today)
        .in("status", ["pending", "completed", "in_progress"])
        .limit(1)
        .maybeSingle();

      if (!workout) return null;

      const structure = parseWorkoutStructure(workout.structure);
      const baseStatus = workout.status as WorkoutBaseStatus;
      return {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        estimatedDuration: workout.estimated_duration,
        status: (baseStatus ?? "pending") as TodayWorkout["status"],
        exerciseCount: structure.length,
        programWorkoutId: null,
        structure,
      };
    },
    enabled: !!athleteId,
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES * 4,
  });

  return {
    workout: data ?? null,
    isLoading,
    refetch,
  };
}
