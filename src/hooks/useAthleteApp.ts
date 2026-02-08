import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReadiness, ReadinessResult } from "@/hooks/useReadiness";
import { useNutritionTargets, NutritionTargets } from "@/hooks/useNutritionTargets";
import { useAthleteHabits } from "@/hooks/useAthleteHabits";
import { useGamification } from "@/hooks/useGamification";
import { format, subDays } from "date-fns";

// ============================================
// UNIFIED ATHLETE APP HOOK
// The "Source of Truth" abstraction layer
// ============================================

// ===== TYPE DEFINITIONS =====

export interface DailyState {
  // Objective metrics (from daily_metrics / wearables)
  hrvRmssd: number | null;
  restingHr: number | null;
  sleepHours: number;
  sleepQuality: number;
  bodyWeight: number | null;
  
  // Subjective metrics (from daily_readiness)
  energy: number;
  stress: number;
  mood: number;
  digestion: number;
  sorenessMap: Record<string, 0 | 1 | 2 | 3>;
  hasPain: boolean;
  
  // Calculated readiness
  readinessScore: number;
  readinessLevel: "high" | "moderate" | "low";
  readinessLabel: string;
  readinessReason: string;
  readinessResult: ReadinessResult;
  
  // Status
  isCheckedIn: boolean;
  isNewUser: boolean;
  dataPoints: number;
}

export interface TodayWorkout {
  id: string;
  title: string;
  description?: string | null;
  estimatedDuration: number | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  exerciseCount: number;
  programWorkoutId?: string | null;
}

export interface CoachBranding {
  coachId: string | null;
  coachName: string | null;
  logoUrl: string | null;
  brandColor: string | null;
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

// Sync status for offline-first
export type SyncStatus = "synced" | "syncing" | "pending" | "error" | "offline";

export interface AthleteAppState {
  // User identity
  athleteId: string | null;
  athleteName: string | null;
  avatarUrl: string | null;
  
  // Consolidated daily state
  dailyState: DailyState;
  
  // Today's context
  todayWorkout: TodayWorkout | null;
  nutrition: NutritionProgress;
  habits: HabitProgress;
  streak: AthleteStreak;
  
  // Coach branding
  coach: CoachBranding;
  
  // Global states
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  error: Error | null;
  
  // Actions
  refetch: () => void;
  toggleHabit: (habitId: string) => Promise<void>;
  saveReadiness: () => Promise<void>;
}

// ===== MAIN HOOK =====

export function useAthleteApp(): AthleteAppState {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const athleteId = user?.id ?? null;
  
  const today = format(new Date(), "yyyy-MM-dd");

  // ===== CORE DATA HOOKS =====
  
  const {
    readiness,
    tempReadiness,
    setTempReadiness,
    isLoading: readinessLoading,
    isSaving: readinessSaving,
    calculateReadiness,
    saveReadiness: saveReadinessRaw,
    baseline,
  } = useReadiness();

  const {
    targets: nutritionTargets,
    isLoading: nutritionLoading,
    isTrainingDay,
  } = useNutritionTargets(athleteId ?? undefined);

  const {
    habits: rawHabits,
    completedHabits,
    totalHabits,
    completionPercentage: habitsPercentage,
    toggleHabit: toggleHabitRaw,
    isToggling: habitsToggling,
  } = useAthleteHabits(athleteId ?? undefined);

  const {
    currentStreak,
    isStreakDay,
    loading: streakLoading,
  } = useGamification(athleteId ?? undefined);

  // ===== COACH BRANDING =====
  
  const { data: coachData, isLoading: coachLoading } = useQuery({
    queryKey: ["athlete-coach-branding", athleteId],
    queryFn: async (): Promise<CoachBranding> => {
      if (!athleteId) {
        return { coachId: null, coachName: null, logoUrl: null, brandColor: null };
      }

      // Get athlete's coach_id
      const { data: athleteProfile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", athleteId)
        .single();

      if (!athleteProfile?.coach_id) {
        return { coachId: null, coachName: null, logoUrl: null, brandColor: null };
      }

      // Get coach's branding
      const { data: coach } = await supabase
        .from("profiles")
        .select("id, full_name, logo_url, brand_color")
        .eq("id", athleteProfile.coach_id)
        .single();

      return {
        coachId: coach?.id ?? null,
        coachName: coach?.full_name ?? null,
        logoUrl: coach?.logo_url ?? null,
        brandColor: coach?.brand_color ?? null,
      };
    },
    enabled: !!athleteId,
    staleTime: 10 * 60 * 1000,
  });

  // ===== TODAY'S WORKOUT =====
  
  const { data: todayWorkoutData, isLoading: workoutLoading } = useQuery({
    queryKey: ["athlete-today-workout", athleteId, today],
    queryFn: async (): Promise<TodayWorkout | null> => {
      if (!athleteId) return null;

      // First check workout_logs for scheduled workouts (from program)
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
        const workout = logs.workouts as any;
        const structure = workout.structure as any[];
        return {
          id: workout.id,
          title: workout.title,
          description: workout.description,
          estimatedDuration: workout.estimated_duration,
          status: logs.status === "scheduled" ? "pending" : "completed",
          exerciseCount: Array.isArray(structure) ? structure.length : 0,
          programWorkoutId: logs.program_workout_id,
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

      const structure = workout.structure as any[];
      return {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        estimatedDuration: workout.estimated_duration,
        status: workout.status as TodayWorkout["status"],
        exerciseCount: Array.isArray(structure) ? structure.length : 0,
        programWorkoutId: null,
      };
    },
    enabled: !!athleteId,
    staleTime: 60 * 1000,
  });

  // ===== NUTRITION CONSUMED (Mock for now - would connect to food logging) =====
  
  const { data: nutritionConsumed } = useQuery({
    queryKey: ["athlete-nutrition-consumed", athleteId, today],
    queryFn: async () => {
      if (!athleteId) return { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 };

      // Sum up nutrition_logs for today
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
    staleTime: 30 * 1000,
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
      };
    }
    return calculateReadiness(readiness);
  }, [readiness, calculateReadiness, baseline]);

  const dailyState: DailyState = useMemo(
    () => ({
      // Objective
      hrvRmssd: readiness.hrvRmssd,
      restingHr: readiness.restingHr,
      sleepHours: readiness.sleepHours,
      sleepQuality: readiness.sleepQuality,
      bodyWeight: readiness.bodyWeight,
      // Subjective
      energy: readiness.energy,
      stress: readiness.stress,
      mood: readiness.mood,
      digestion: readiness.digestion,
      sorenessMap: readiness.sorenessMap as Record<string, 0 | 1 | 2 | 3>,
      hasPain: Object.values(readiness.sorenessMap).some((v) => v >= 2),
      // Readiness
      readinessScore: readinessResult.score,
      readinessLevel: readinessResult.level,
      readinessLabel: readinessResult.label,
      readinessReason: readinessResult.reason,
      readinessResult,
      // Status
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
      longestEver: currentStreak, // Would need separate query for actual longest
    }),
    [currentStreak, isStreakDay]
  );

  // ===== LOADING STATE =====
  
  const isLoading = 
    readinessLoading || 
    nutritionLoading || 
    workoutLoading || 
    coachLoading || 
    streakLoading;

  const isSyncing = readinessSaving || habitsToggling;

  // ===== ACTIONS =====

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["athlete"] });
    queryClient.invalidateQueries({ queryKey: ["daily-readiness"] });
    queryClient.invalidateQueries({ queryKey: ["nutrition"] });
  };

  const toggleHabit = async (habitId: string) => {
    // Find the habit to get its current completion status
    const habit = rawHabits.find(h => h.athlete_habit_id === habitId || h.id === habitId);
    if (habit) {
      await toggleHabitRaw(habit.athlete_habit_id, !habit.isCompleted);
    }
  };

  const saveReadiness = async () => {
    await saveReadinessRaw(tempReadiness);
  };

  // ===== RETURN =====

  return {
    athleteId,
    athleteName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    dailyState,
    todayWorkout: todayWorkoutData ?? null,
    nutrition,
    habits,
    streak,
    coach: coachData ?? { coachId: null, coachName: null, logoUrl: null, brandColor: null },
    isLoading,
    isSyncing,
    syncStatus: isSyncing ? "syncing" : "synced",
    error: null,
    refetch,
    toggleHabit,
    saveReadiness,
  };
}

// ===== SELECTOR HOOKS (for granular subscriptions) =====

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
