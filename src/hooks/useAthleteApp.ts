import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAthleteProfile, CoachBranding } from "@/hooks/useAthleteProfile";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { useTodaysWorkout, TodayWorkout } from "@/hooks/useTodaysWorkout";
import { useReadiness, ReadinessResult } from "@/hooks/useReadiness";
import { useNutritionTargets, NutritionTargets } from "@/hooks/useNutritionTargets";
import { useAthleteHabits } from "@/hooks/useAthleteHabits";
import { useGamification } from "@/hooks/useGamification";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// ===== TYPE DEFINITIONS =====

export interface DailyState {
  hrvRmssd: number | null;
  restingHr: number | null;
  sleepHours: number;
  sleepQuality: number;
  bodyWeight: number | null;
  energy: number;
  stress: number;
  mood: number;
  digestion: number;
  sorenessMap: Record<string, 0 | 1 | 2 | 3>;
  hasPain: boolean;
  readinessScore: number;
  readinessLevel: "high" | "moderate" | "low";
  readinessLabel: string;
  readinessReason: string;
  readinessResult: ReadinessResult;
  isCheckedIn: boolean;
  isNewUser: boolean;
  dataPoints: number;
}

export interface AthleteStreak {
  current: number;
  isActive: boolean;
  longestEver: number;
}

export interface HabitProgress {
  completed: number;
  total: number;
  percentage: number;
  habits: Array<{
    id: string;
    name: string;
    category: string;
    isCompleted: boolean;
  }>;
}

export interface NutritionProgress {
  targets: NutritionTargets;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    water: number;
  };
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  isTrainingDay: boolean;
}

export type SyncStatus = "synced" | "syncing" | "pending" | "error" | "offline";

export interface AthleteAppState {
  athleteId: string | null;
  athleteName: string | null;
  avatarUrl: string | null;
  dailyState: DailyState;
  todayWorkout: TodayWorkout | null;
  nutrition: NutritionProgress;
  habits: HabitProgress;
  streak: AthleteStreak;
  coach: CoachBranding;
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  error: Error | null;
  refetch: () => void;
  toggleHabit: (habitId: string) => Promise<void>;
  saveReadiness: () => Promise<void>;
}

// Re-export granular hooks
export { useAthleteProfile } from "@/hooks/useAthleteProfile";
export { useActiveProgram } from "@/hooks/useActiveProgram";
export { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
export type { CoachBranding } from "@/hooks/useAthleteProfile";
export type { TodayWorkout } from "@/hooks/useTodaysWorkout";

// ===== COMPOSITE HOOK =====

export function useAthleteApp(): AthleteAppState {
  const queryClient = useQueryClient();

  // Granular, independently-cached hooks
  const { athleteId, athleteName, avatarUrl, coach, isLoading: profileLoading } = useAthleteProfile();
  const { workout: todayWorkout, isLoading: workoutLoading } = useTodaysWorkout();

  const today = format(new Date(), "yyyy-MM-dd");

  // ===== READINESS =====
  const {
    readiness,
    tempReadiness,
    isLoading: readinessLoading,
    isSaving: readinessSaving,
    calculateReadiness,
    saveReadiness: saveReadinessRaw,
    baseline,
  } = useReadiness();

  // ===== NUTRITION =====
  const {
    targets: nutritionTargets,
    isLoading: nutritionLoading,
    isTrainingDay,
  } = useNutritionTargets(athleteId ?? undefined);

  // ===== HABITS =====
  const {
    habits: rawHabits,
    completedHabits,
    totalHabits,
    completionPercentage: habitsPercentage,
    toggleHabit: toggleHabitRaw,
    isToggling: habitsToggling,
  } = useAthleteHabits(athleteId ?? undefined);

  // ===== STREAK =====
  const {
    currentStreak,
    isStreakDay,
    loading: streakLoading,
  } = useGamification(athleteId ?? undefined);

  // ===== NUTRITION CONSUMED =====
  const { data: nutritionConsumed } = useQuery({
    queryKey: ["athlete-nutrition-consumed", athleteId, today],
    queryFn: async () => {
      if (!athleteId) return { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 };

      const { data: logs } = await supabase
        .from("nutrition_logs")
        .select("calories, protein, carbs, fats, water")
        .eq("athlete_id", athleteId)
        .eq("date", today);

      if (!logs || logs.length === 0) {
        return { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 };
      }

      return logs.reduce(
        (acc, log) => ({
          calories: acc.calories + (log.calories ?? 0),
          protein: acc.protein + (log.protein ?? 0),
          carbs: acc.carbs + (log.carbs ?? 0),
          fats: acc.fats + (log.fats ?? 0),
          water: acc.water + (log.water ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 }
      );
    },
    enabled: !!athleteId,
    staleTime: Infinity,
  });

  // ===== COMPUTED VALUES =====

  const readinessResult = useMemo(() => {
    if (!readiness.isCompleted) {
      return {
        score: 0,
        level: "moderate" as const,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        label: "Non Completato",
        reason: "Completa il check-in",
        penalties: [],
        isNewUser: baseline.isNewUser,
        dataPoints: baseline.dataPoints,
        breakdown: null,
        hrvStatus: "optimal" as const,
        rhrStatus: "optimal" as const,
      };
    }
    return calculateReadiness(readiness);
  }, [readiness, calculateReadiness, baseline]);

  const dailyState: DailyState = useMemo(
    () => ({
      hrvRmssd: readiness.hrvRmssd,
      restingHr: readiness.restingHr,
      sleepHours: readiness.sleepHours,
      sleepQuality: readiness.sleepQuality,
      bodyWeight: readiness.bodyWeight,
      energy: readiness.energy,
      stress: readiness.stress,
      mood: readiness.mood,
      digestion: readiness.digestion,
      sorenessMap: readiness.sorenessMap as Record<string, 0 | 1 | 2 | 3>,
      hasPain: Object.values(readiness.sorenessMap).some((v) => v >= 2),
      readinessScore: readinessResult.score,
      readinessLevel: readinessResult.level,
      readinessLabel: readinessResult.label,
      readinessReason: readinessResult.reason,
      readinessResult,
      isCheckedIn: readiness.isCompleted,
      isNewUser: baseline.isNewUser,
      dataPoints: baseline.dataPoints,
    }),
    [readiness, readinessResult, baseline]
  );

  const nutrition: NutritionProgress = useMemo(() => {
    const consumed = nutritionConsumed ?? { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 };
    return {
      targets: nutritionTargets,
      consumed,
      percentages: {
        calories: Math.min(100, Math.round((consumed.calories / nutritionTargets.calories) * 100)),
        protein: Math.min(100, Math.round((consumed.protein / nutritionTargets.protein) * 100)),
        carbs: Math.min(100, Math.round((consumed.carbs / nutritionTargets.carbs) * 100)),
        fats: Math.min(100, Math.round((consumed.fats / nutritionTargets.fats) * 100)),
      },
      isTrainingDay,
    };
  }, [nutritionTargets, nutritionConsumed, isTrainingDay]);

  const habits: HabitProgress = useMemo(
    () => ({
      completed: completedHabits,
      total: totalHabits,
      percentage: habitsPercentage,
      habits: rawHabits.map((h) => ({
        id: h.id,
        name: h.name,
        category: h.category,
        isCompleted: h.isCompleted,
      })),
    }),
    [rawHabits, completedHabits, totalHabits, habitsPercentage]
  );

  const streak: AthleteStreak = useMemo(
    () => ({
      current: currentStreak,
      isActive: isStreakDay,
      longestEver: currentStreak,
    }),
    [currentStreak, isStreakDay]
  );

  const isLoading = readinessLoading || nutritionLoading || workoutLoading || profileLoading || streakLoading;
  const isSyncing = readinessSaving || habitsToggling;

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["athlete"] });
    queryClient.invalidateQueries({ queryKey: ["daily-readiness"] });
    queryClient.invalidateQueries({ queryKey: ["nutrition"] });
    queryClient.invalidateQueries({ queryKey: ["athlete-today-workout"] });
  };

  const toggleHabit = async (habitId: string) => {
    const habit = rawHabits.find(h => h.athlete_habit_id === habitId || h.id === habitId);
    if (habit) {
      await toggleHabitRaw(habit.athlete_habit_id, !habit.isCompleted);
    }
  };

  const saveReadiness = async () => {
    await saveReadinessRaw(tempReadiness);
  };

  return {
    athleteId,
    athleteName,
    avatarUrl,
    dailyState,
    todayWorkout,
    nutrition,
    habits,
    streak,
    coach,
    isLoading,
    isSyncing,
    syncStatus: isSyncing ? "syncing" : "synced",
    error: null,
    refetch,
    toggleHabit,
    saveReadiness,
  };
}

// ===== SELECTOR HOOKS (backward compat) =====

export function useAthleteReadiness() {
  const { dailyState, saveReadiness, isLoading } = useAthleteApp();
  return { ...dailyState, saveReadiness, isLoading };
}

export function useAthleteTodayWorkout() {
  const { todayWorkout, isLoading } = useAthleteApp();
  return { workout: todayWorkout, isLoading };
}

export function useAthleteNutrition() {
  const { nutrition, isLoading } = useAthleteApp();
  return { ...nutrition, isLoading };
}

export function useAthleteCoach() {
  const { coach, isLoading } = useAthleteApp();
  return { ...coach, isLoading };
}
