import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  estimateTDEE,
  smoothWeightSeries,
  generateNutritionSuggestion,
  type WeightEntry,
  type CalorieEntry,
} from "@/lib/math/nutritionMath";

// ── Re-exports for backward compat ────────────────────────────────────

export type GoalType = "cut" | "maintain" | "bulk";

export interface WeightDataPoint {
  date: string;
  dayIndex: number;
  rawWeight: number | null;
  trendWeight: number;
}

export interface StallDetection {
  isStalling: boolean;
  stallWeeks: number;
  suggestedAdjustment: number | null;
  adjustmentMessage: string | null;
}

export interface GoalCompliance {
  isCompliant: boolean;
  targetCalories: number;
  actualAverage: number;
  variance: number;
  message: string;
}

export interface CoachingAction {
  type: "warning" | "suggestion" | "info";
  title: string;
  message: string;
  actionLabel?: string;
  actionValue?: number;
}

export interface TDEEResult {
  estimatedTDEE: number | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  startTrend: number | null;
  endTrend: number | null;
  weightChange: number | null;
  weightChangePerWeek: number | null;
  weightChangePercent: number | null;
  averageIntake: number | null;
  totalDays: number;
  daysWithCalories: number;
  daysWithWeight: number;
  weightData: WeightDataPoint[];
  recommendation: {
    goal: GoalType;
    targetCalories: number | null;
    weeklyChange: number;
    message: string;
  } | null;
  stallDetection: StallDetection;
  goalCompliance: GoalCompliance | null;
  coachingAction: CoachingAction | null;
  trendDirection: "up" | "down" | "stable";
}

import { NUTRITION_BASELINE_DAYS } from "@/lib/math/constants";

// ── Constants ──────────────────────────────────────────────────────────

const LOOKBACK_DAYS = NUTRITION_BASELINE_DAYS;

// ── Raw types ──────────────────────────────────────────────────────────

interface DailyMetricRaw { date: string; weight_kg: number | null }
interface DailyReadinessRaw { date: string; body_weight: number | null }
interface NutritionLogRaw { date: string; calories: number | null }

// ── Helpers ────────────────────────────────────────────────────────────

function getLastNDays(days: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    result.push(d.toISOString().split("T")[0]);
  }
  return result;
}

function buildRecommendation(
  tdee: number,
  goal: GoalType,
): TDEEResult["recommendation"] {
  switch (goal) {
    case "cut": {
      const t = Math.max(Math.round((tdee - 550) / 50) * 50, 1200);
      return { goal, targetCalories: t, weeklyChange: -0.5, message: `Per perdere 0.5 kg/sett, target ${t.toLocaleString()} kcal` };
    }
    case "bulk": {
      const t = Math.round((tdee + 275) / 50) * 50;
      return { goal, targetCalories: t, weeklyChange: 0.25, message: `Per guadagnare 0.25 kg/sett, target ${t} kcal` };
    }
    case "maintain": {
      const t = Math.round(tdee / 50) * 50;
      return { goal, targetCalories: t, weeklyChange: 0, message: `Per mantenere, target ${t} kcal` };
    }
  }
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useAdaptiveTDEE(athleteId?: string, goal: GoalType = "cut") {
  const { user } = useAuth();
  const targetUserId = athleteId ?? user?.id;

  const metricsQuery = useQuery({
    queryKey: ["adaptive-tdee-metrics", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, weight_kg")
        .eq("user_id", targetUserId)
        .gte("date", cutoff.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyMetricRaw[];
    },
    enabled: !!targetUserId,
  });

  const readinessQuery = useQuery({
    queryKey: ["adaptive-tdee-readiness", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
      const { data, error } = await supabase
        .from("daily_readiness")
        .select("date, body_weight")
        .eq("athlete_id", targetUserId)
        .gte("date", cutoff.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyReadinessRaw[];
    },
    enabled: !!targetUserId,
  });

  const nutritionQuery = useQuery({
    queryKey: ["adaptive-tdee-nutrition", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("date, calories")
        .eq("athlete_id", targetUserId)
        .gte("date", cutoff.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NutritionLogRaw[];
    },
    enabled: !!targetUserId,
  });

  // All math is memoized — only recalculates when raw data changes
  const result: TDEEResult = useMemo(() => {
    const days = getLastNDays(LOOKBACK_DAYS);

    // Merge weight sources (daily_metrics > daily_readiness)
    const weightMap = new Map<string, number>();
    for (const r of readinessQuery.data ?? []) {
      if (r.body_weight !== null) weightMap.set(r.date, Number(r.body_weight));
    }
    for (const m of metricsQuery.data ?? []) {
      if (m.weight_kg !== null) weightMap.set(m.date, Number(m.weight_kg));
    }

    // Aggregate calories by date
    const calorieMap = new Map<string, number>();
    for (const n of nutritionQuery.data ?? []) {
      if (n.calories !== null) {
        calorieMap.set(n.date, (calorieMap.get(n.date) ?? 0) + n.calories);
      }
    }

    // Build arrays for pure math functions
    const weights: WeightEntry[] = [];
    const rawWeightsArr: (number | null)[] = [];
    for (const date of days) {
      const w = weightMap.get(date) ?? null;
      rawWeightsArr.push(w);
      if (w !== null) weights.push({ date, weight: w });
    }

    const calories: CalorieEntry[] = [];
    for (const [date, cal] of calorieMap) {
      calories.push({ date, calories: cal });
    }

    const daysWithWeight = weights.length;
    const daysWithCalories = calories.length;

    // Delegate to pure math
    const tdeeEstimate = estimateTDEE(weights, calories, LOOKBACK_DAYS);
    const trendValues = smoothWeightSeries(rawWeightsArr, 0.1);

    // Build chart data
    const weightData: WeightDataPoint[] = days
      .map((date, i) => ({
        date,
        dayIndex: i + 1,
        rawWeight: rawWeightsArr[i],
        trendWeight: trendValues[i] ?? 0,
      }))
      .filter((d) => d.rawWeight !== null || d.trendWeight > 0);

    // Empty state
    if (tdeeEstimate.tdee === null) {
      return {
        estimatedTDEE: null,
        confidence: tdeeEstimate.confidence,
        startTrend: null,
        endTrend: null,
        weightChange: null,
        weightChangePerWeek: null,
        weightChangePercent: null,
        averageIntake: tdeeEstimate.averageIntake,
        totalDays: LOOKBACK_DAYS,
        daysWithCalories,
        daysWithWeight,
        weightData,
        recommendation: null,
        stallDetection: { isStalling: false, stallWeeks: 0, suggestedAdjustment: null, adjustmentMessage: null },
        goalCompliance: null,
        coachingAction: null,
        trendDirection: "stable" as const,
      };
    }

    const { tdee, weightTrendStart, weightTrendEnd, weightChangePerWeek, averageIntake, trendDirection } = tdeeEstimate;
    const weightChange = weightTrendEnd !== null && weightTrendStart !== null ? weightTrendEnd - weightTrendStart : null;
    const weightChangePercent =
      weightChangePerWeek !== null && weightTrendEnd !== null && weightTrendEnd > 0
        ? Math.round(((weightChangePerWeek / weightTrendEnd) * 100) * 100) / 100
        : null;

    const recommendation = buildRecommendation(tdee, goal);

    // Stall detection
    const stallDetection: StallDetection = { isStalling: false, stallWeeks: 0, suggestedAdjustment: null, adjustmentMessage: null };
    if (weightChangePerWeek !== null && Math.abs(weightChangePerWeek) < 0.15 && daysWithWeight >= 10) {
      const firstIdx = rawWeightsArr.findIndex((w) => w !== null);
      const lastIdx = rawWeightsArr.length - 1 - [...rawWeightsArr].reverse().findIndex((w) => w !== null);
      const span = Math.max(lastIdx - firstIdx, 1);
      const stallWeeks = Math.floor(span / 7);
      if (stallWeeks >= 2) {
        stallDetection.isStalling = true;
        stallDetection.stallWeeks = stallWeeks;
        stallDetection.suggestedAdjustment = goal === "bulk" ? 100 : -150;
        stallDetection.adjustmentMessage = `Peso stabile da ${stallWeeks} settimane. ${goal === "bulk" ? "Aggiungi 100" : "Riduci 150"} kcal.`;
      }
    }

    // Goal compliance
    let goalCompliance: GoalCompliance | null = null;
    if (recommendation?.targetCalories && averageIntake) {
      const variance = ((averageIntake - recommendation.targetCalories) / recommendation.targetCalories) * 100;
      goalCompliance = {
        isCompliant: Math.abs(variance) <= 5,
        targetCalories: recommendation.targetCalories,
        actualAverage: averageIntake,
        variance: Math.round(variance * 10) / 10,
        message: Math.abs(variance) <= 5
          ? "On track!"
          : `${variance > 0 ? "Sopra" : "Sotto"} target del ${Math.abs(Math.round(variance))}%`,
      };
    }

    // Coaching action from pure math
    const suggestion = generateNutritionSuggestion(goal, weightChangePerWeek, tdee, averageIntake);
    const coachingAction: CoachingAction | null = suggestion
      ? {
          type: suggestion.type,
          title: suggestion.title,
          message: suggestion.message,
          ...(suggestion.adjustment !== null
            ? {
                actionLabel: `${suggestion.adjustment > 0 ? "+" : ""}${suggestion.adjustment} kcal`,
                actionValue: suggestion.adjustment,
              }
            : {}),
        }
      : null;

    return {
      estimatedTDEE: tdee,
      confidence: tdeeEstimate.confidence,
      startTrend: weightTrendStart,
      endTrend: weightTrendEnd,
      weightChange: weightChange !== null ? Math.round(weightChange * 100) / 100 : null,
      weightChangePerWeek,
      weightChangePercent,
      averageIntake,
      totalDays: LOOKBACK_DAYS,
      daysWithCalories,
      daysWithWeight,
      weightData,
      recommendation,
      stallDetection,
      goalCompliance,
      coachingAction,
      trendDirection,
    };
  }, [metricsQuery.data, readinessQuery.data, nutritionQuery.data, goal]);

  return {
    ...result,
    isLoading: metricsQuery.isLoading || readinessQuery.isLoading || nutritionQuery.isLoading,
    error: metricsQuery.error || readinessQuery.error || nutritionQuery.error,
    refetch: () => {
      metricsQuery.refetch();
      readinessQuery.refetch();
      nutritionQuery.refetch();
    },
  };
}
