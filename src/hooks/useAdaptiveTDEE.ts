import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type GoalType = "cut" | "maintain" | "bulk";

interface DailyMetricRaw {
  date: string;
  weight_kg: number | null;
}

interface DailyReadinessRaw {
  date: string;
  body_weight: number | null;
}

interface NutritionLogRaw {
  date: string;
  calories: number | null;
}

export interface WeightDataPoint {
  date: string;
  dayIndex: number;
  rawWeight: number | null;
  trendWeight: number;
}

export interface StallDetection {
  isStalling: boolean;
  stallWeeks: number;
  suggestedAdjustment: number | null; // kcal to reduce/add
  adjustmentMessage: string | null;
}

export interface GoalCompliance {
  isCompliant: boolean;
  targetCalories: number;
  actualAverage: number;
  variance: number; // percentage
  message: string;
}

export interface TDEEResult {
  // Core metrics
  estimatedTDEE: number | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  
  // Weight trend data
  startTrend: number | null;
  endTrend: number | null;
  weightChange: number | null;
  weightChangePerWeek: number | null;
  
  // Calorie data
  averageIntake: number | null;
  totalDays: number;
  daysWithCalories: number;
  daysWithWeight: number;
  
  // Chart data
  weightData: WeightDataPoint[];
  
  // Recommendations
  recommendation: {
    goal: GoalType;
    targetCalories: number | null;
    weeklyChange: number; // kg/week target
    message: string;
  } | null;
  
  // Stall detection (MacroFactor style)
  stallDetection: StallDetection;
  
  // Goal compliance
  goalCompliance: GoalCompliance | null;
}

/**
 * Calculate Exponential Moving Average with alpha smoothing
 * Lower alpha = more smoothing (0.1 is very smooth)
 */
function calculateEMA(values: (number | null)[], alpha: number = 0.1): number[] {
  const result: number[] = [];
  let lastEMA: number | null = null;
  
  for (const value of values) {
    if (value === null) {
      // Carry forward the last EMA if no value
      if (lastEMA !== null) {
        result.push(lastEMA);
      }
      continue;
    }
    
    if (lastEMA === null) {
      // First valid value becomes the initial EMA
      lastEMA = value;
    } else {
      lastEMA = alpha * value + (1 - alpha) * lastEMA;
    }
    result.push(lastEMA);
  }
  
  return result;
}

/**
 * Fill gaps in weight data by interpolating between known values
 */
function fillWeightGaps(
  dates: string[],
  rawWeights: Map<string, number>
): (number | null)[] {
  const result: (number | null)[] = [];
  
  for (const date of dates) {
    const weight = rawWeights.get(date);
    result.push(weight ?? null);
  }
  
  return result;
}

/**
 * Generate array of dates for the last N days
 */
function getLastNDays(days: number): string[] {
  const result: string[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    result.push(date.toISOString().split("T")[0]);
  }
  
  return result;
}

export function useAdaptiveTDEE(athleteId?: string, goal: GoalType = "cut") {
  const { user } = useAuth();
  const targetUserId = athleteId ?? user?.id;
  
  // Fetch last 14 days of weight from daily_metrics
  const metricsQuery = useQuery({
    queryKey: ["adaptive-tdee-metrics", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, weight_kg")
        .eq("user_id", targetUserId)
        .gte("date", fourteenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });
      
      if (error) throw error;
      return (data ?? []) as DailyMetricRaw[];
    },
    enabled: !!targetUserId,
  });
  
  // Also fetch from daily_readiness as fallback
  const readinessQuery = useQuery({
    queryKey: ["adaptive-tdee-readiness", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const { data, error } = await supabase
        .from("daily_readiness")
        .select("date, body_weight")
        .eq("athlete_id", targetUserId)
        .gte("date", fourteenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });
      
      if (error) throw error;
      return (data ?? []) as DailyReadinessRaw[];
    },
    enabled: !!targetUserId,
  });
  
  // Fetch last 14 days of nutrition logs
  const nutritionQuery = useQuery({
    queryKey: ["adaptive-tdee-nutrition", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("date, calories")
        .eq("athlete_id", targetUserId)
        .gte("date", fourteenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });
      
      if (error) throw error;
      return (data ?? []) as NutritionLogRaw[];
    },
    enabled: !!targetUserId,
  });
  
  // Process the data
  const processData = (): TDEEResult => {
    const days = getLastNDays(14);
    
    // Merge weight data from both sources (prefer daily_metrics)
    const weightMap = new Map<string, number>();
    
    // First add from daily_readiness
    for (const r of readinessQuery.data ?? []) {
      if (r.body_weight !== null) {
        weightMap.set(r.date, Number(r.body_weight));
      }
    }
    
    // Then override with daily_metrics (higher priority)
    for (const m of metricsQuery.data ?? []) {
      if (m.weight_kg !== null) {
        weightMap.set(m.date, Number(m.weight_kg));
      }
    }
    
    // Aggregate calories by date
    const calorieMap = new Map<string, number>();
    for (const n of nutritionQuery.data ?? []) {
      if (n.calories !== null) {
        const existing = calorieMap.get(n.date) ?? 0;
        calorieMap.set(n.date, existing + n.calories);
      }
    }
    
    // Fill weight array for each day
    const rawWeights = fillWeightGaps(days, weightMap);
    
    // Calculate EMA trend with alpha = 0.1 (smooth)
    const trendValues = calculateEMA(rawWeights, 0.1);
    
    // Build chart data
    const weightData: WeightDataPoint[] = days.map((date, index) => ({
      date,
      dayIndex: index + 1,
      rawWeight: rawWeights[index],
      trendWeight: trendValues[index] ?? 0,
    })).filter(d => d.rawWeight !== null || d.trendWeight > 0);
    
    // Count valid data points
    const daysWithWeight = rawWeights.filter(w => w !== null).length;
    const daysWithCalories = calorieMap.size;
    
    // Insufficient data check
    if (daysWithWeight < 3 || daysWithCalories < 3) {
      return {
        estimatedTDEE: null,
        confidence: "insufficient",
        startTrend: null,
        endTrend: null,
        weightChange: null,
        weightChangePerWeek: null,
        averageIntake: null,
        totalDays: 14,
        daysWithCalories,
        daysWithWeight,
        weightData,
        recommendation: null,
        stallDetection: {
          isStalling: false,
          stallWeeks: 0,
          suggestedAdjustment: null,
          adjustmentMessage: null,
        },
        goalCompliance: null,
      };
    }
    
    // Calculate averages
    const totalCalories = Array.from(calorieMap.values()).reduce((a, b) => a + b, 0);
    const averageIntake = Math.round(totalCalories / daysWithCalories);
    
    // Get start and end trend values
    const validTrends = trendValues.filter(t => t > 0);
    if (validTrends.length < 2) {
      return {
        estimatedTDEE: null,
        confidence: "insufficient",
        startTrend: null,
        endTrend: null,
        weightChange: null,
        weightChangePerWeek: null,
        averageIntake,
        totalDays: 14,
        daysWithCalories,
        daysWithWeight,
        weightData,
        recommendation: null,
        stallDetection: {
          isStalling: false,
          stallWeeks: 0,
          suggestedAdjustment: null,
          adjustmentMessage: null,
        },
        goalCompliance: null,
      };
    }
    
    const startTrend = validTrends[0];
    const endTrend = validTrends[validTrends.length - 1];
    const weightChange = endTrend - startTrend;
    
    // Calculate actual days between first and last measurement
    const firstWeightIndex = rawWeights.findIndex(w => w !== null);
    const lastWeightIndex = rawWeights.length - 1 - [...rawWeights].reverse().findIndex(w => w !== null);
    const actualDays = Math.max(lastWeightIndex - firstWeightIndex, 1);
    
    // Weekly change rate
    const weightChangePerWeek = (weightChange / actualDays) * 7;
    
    // TDEE Formula: Avg Intake + ((Start_Trend - End_Trend) * 7700 / Days)
    // Note: If losing weight, Start > End, so deficit is positive, meaning TDEE > intake
    const calorieDeficit = ((startTrend - endTrend) * 7700) / actualDays;
    const estimatedTDEE = Math.round(averageIntake + calorieDeficit);
    
    // Determine confidence based on data completeness
    let confidence: TDEEResult["confidence"];
    if (daysWithWeight >= 10 && daysWithCalories >= 10) {
      confidence = "high";
    } else if (daysWithWeight >= 7 && daysWithCalories >= 7) {
      confidence = "medium";
    } else {
      confidence = "low";
    }
    
    // Generate recommendation based on goal
    let recommendation: TDEEResult["recommendation"] = null;
    
    if (estimatedTDEE > 0) {
      switch (goal) {
        case "cut": {
          // Target 0.5kg/week loss = 550 kcal deficit
          const targetCalories = estimatedTDEE - 550;
          recommendation = {
            goal: "cut",
            targetCalories: Math.max(Math.round(targetCalories / 50) * 50, 1200), // Round to 50, min 1200
            weeklyChange: -0.5,
            message: `To lose 0.5kg/week, target ${Math.max(Math.round(targetCalories / 50) * 50, 1200).toLocaleString()} kcal`,
          };
          break;
        }
        case "bulk": {
          // Target 0.25kg/week gain = 275 kcal surplus
          const targetCalories = estimatedTDEE + 275;
          recommendation = {
            goal: "bulk",
            targetCalories: Math.round(targetCalories / 50) * 50,
            weeklyChange: 0.25,
            message: `To gain 0.25kg/week, target ${Math.round(targetCalories / 50) * 50} kcal`,
          };
          break;
        }
        case "maintain": {
          recommendation = {
            goal: "maintain",
            targetCalories: Math.round(estimatedTDEE / 50) * 50,
            weeklyChange: 0,
            message: `To maintain weight, target ${Math.round(estimatedTDEE / 50) * 50} kcal`,
          };
          break;
        }
      }
    }
    
    // Stall Detection: Check if weight trend is flat for >2 weeks on a cut
    // A "stall" means less than 0.1kg change per week when trying to lose weight
    const stallDetection: StallDetection = {
      isStalling: false,
      stallWeeks: 0,
      suggestedAdjustment: null,
      adjustmentMessage: null,
    };
    
    if (goal === "cut" && Math.abs(weightChangePerWeek) < 0.1 && daysWithWeight >= 10) {
      // Calculate how many weeks of data we have with minimal change
      const stallWeeks = Math.floor(actualDays / 7);
      if (stallWeeks >= 2) {
        stallDetection.isStalling = true;
        stallDetection.stallWeeks = stallWeeks;
        // Suggest 150kcal reduction (conservative adjustment)
        stallDetection.suggestedAdjustment = -150;
        stallDetection.adjustmentMessage = `Weight stalled for ${stallWeeks} weeks. Consider reducing by 150 kcal.`;
      }
    } else if (goal === "bulk" && Math.abs(weightChangePerWeek) < 0.05 && daysWithWeight >= 10) {
      const stallWeeks = Math.floor(actualDays / 7);
      if (stallWeeks >= 2) {
        stallDetection.isStalling = true;
        stallDetection.stallWeeks = stallWeeks;
        stallDetection.suggestedAdjustment = 100;
        stallDetection.adjustmentMessage = `Weight stalled for ${stallWeeks} weeks. Consider adding 100 kcal.`;
      }
    }
    
    // Goal Compliance: Check if within ±5% of target calories
    let goalCompliance: GoalCompliance | null = null;
    
    if (recommendation && recommendation.targetCalories && averageIntake) {
      const targetCal = recommendation.targetCalories;
      const variance = ((averageIntake - targetCal) / targetCal) * 100;
      const isCompliant = Math.abs(variance) <= 5;
      
      goalCompliance = {
        isCompliant,
        targetCalories: targetCal,
        actualAverage: averageIntake,
        variance: Math.round(variance * 10) / 10,
        message: isCompliant 
          ? "On track! Keep it up." 
          : variance > 5 
            ? `Over target by ${Math.abs(Math.round(variance))}%` 
            : `Under target by ${Math.abs(Math.round(variance))}%`,
      };
    }
    
    return {
      estimatedTDEE,
      confidence,
      startTrend: Math.round(startTrend * 10) / 10,
      endTrend: Math.round(endTrend * 10) / 10,
      weightChange: Math.round(weightChange * 100) / 100,
      weightChangePerWeek: Math.round(weightChangePerWeek * 100) / 100,
      averageIntake,
      totalDays: 14,
      daysWithCalories,
      daysWithWeight,
      weightData,
      recommendation,
      stallDetection,
      goalCompliance,
    };
  };
  
  const result = processData();
  
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
