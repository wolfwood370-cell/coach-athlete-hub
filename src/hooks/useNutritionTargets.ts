import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  isTrainingDay: boolean;
  strategyMode: "static" | "cycling_on_off";
  strategyType: string;
}

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2400,
  protein: 180,
  carbs: 260,
  fats: 75,
  water: 2500,
  isTrainingDay: false,
  strategyMode: "static",
  strategyType: "maintain",
};

interface CyclingTargets {
  on?: {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
  };
  off?: {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
  };
}

/**
 * Hook to fetch dynamic nutrition targets based on:
 * 1. The athlete's nutrition_plan
 * 2. Whether today is a training day (has scheduled/pending workout)
 * 3. If cycling mode, use on/off targets accordingly
 */
export function useNutritionTargets(athleteId?: string) {
  const { user } = useAuth();
  const targetUserId = athleteId ?? user?.id;
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch the active nutrition plan
  const planQuery = useQuery({
    queryKey: ["nutrition-plan", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("athlete_id", targetUserId)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if today has a workout scheduled (training day detection)
  const workoutQuery = useQuery({
    queryKey: ["today-has-workout", targetUserId, today],
    queryFn: async () => {
      if (!targetUserId) return false;

      // Check workouts table for today's scheduled workout (any non-skipped status)
      const { data: workouts, error: workoutError } = await supabase
        .from("workouts")
        .select("id")
        .eq("athlete_id", targetUserId)
        .eq("scheduled_date", today)
        .in("status", ["pending", "in_progress", "completed"])
        .limit(1);

      if (workoutError) {
        console.error("Error checking workouts:", workoutError);
        return false;
      }

      if (workouts && workouts.length > 0) {
        return true;
      }

      // Also check workout_logs for scheduled workouts
      const { data: logs, error: logsError } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("athlete_id", targetUserId)
        .eq("scheduled_date", today)
        .in("status", ["scheduled", "completed"])
        .limit(1);

      if (logsError) {
        console.error("Error checking workout_logs:", logsError);
        return false;
      }

      return logs && logs.length > 0;
    },
    enabled: !!targetUserId,
    staleTime: 60 * 1000, // 1 minute
  });

  // Compute the final targets
  const computeTargets = (): NutritionTargets => {
    const plan = planQuery.data;
    const isTrainingDay = workoutQuery.data ?? false;

    // No plan found - use defaults
    if (!plan) {
      return { ...DEFAULT_TARGETS, isTrainingDay };
    }

    const strategyMode = (plan.strategy_mode as "static" | "cycling_on_off") || "static";
    const strategyType = plan.strategy_type || "maintain";

    // Static mode - use base values
    if (strategyMode === "static") {
      return {
        calories: plan.daily_calories || DEFAULT_TARGETS.calories,
        protein: plan.protein_g || DEFAULT_TARGETS.protein,
        carbs: plan.carbs_g || DEFAULT_TARGETS.carbs,
        fats: plan.fats_g || DEFAULT_TARGETS.fats,
        water: DEFAULT_TARGETS.water, // Not stored in plan
        isTrainingDay,
        strategyMode,
        strategyType,
      };
    }

    // Cycling mode - use on/off targets based on training day
    const cyclingTargets = plan.cycling_targets as CyclingTargets | null;

    if (!cyclingTargets) {
      // Fallback to base values if no cycling targets defined
      return {
        calories: plan.daily_calories || DEFAULT_TARGETS.calories,
        protein: plan.protein_g || DEFAULT_TARGETS.protein,
        carbs: plan.carbs_g || DEFAULT_TARGETS.carbs,
        fats: plan.fats_g || DEFAULT_TARGETS.fats,
        water: DEFAULT_TARGETS.water,
        isTrainingDay,
        strategyMode,
        strategyType,
      };
    }

    const dayTargets = isTrainingDay ? cyclingTargets.on : cyclingTargets.off;

    // Merge with fallbacks
    return {
      calories: dayTargets?.calories ?? plan.daily_calories ?? DEFAULT_TARGETS.calories,
      protein: dayTargets?.protein_g ?? plan.protein_g ?? DEFAULT_TARGETS.protein,
      carbs: dayTargets?.carbs_g ?? plan.carbs_g ?? DEFAULT_TARGETS.carbs,
      fats: dayTargets?.fats_g ?? plan.fats_g ?? DEFAULT_TARGETS.fats,
      water: DEFAULT_TARGETS.water,
      isTrainingDay,
      strategyMode,
      strategyType,
    };
  };

  return {
    targets: computeTargets(),
    isLoading: planQuery.isLoading || workoutQuery.isLoading,
    error: planQuery.error || workoutQuery.error,
    refetch: () => {
      planQuery.refetch();
      workoutQuery.refetch();
    },
    hasPlan: !!planQuery.data,
    isTrainingDay: workoutQuery.data ?? false,
  };
}
