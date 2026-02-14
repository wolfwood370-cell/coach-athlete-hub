/**
 * Nutrition Math — Pure utilities for adaptive TDEE estimation.
 *
 * Uses EWMA to smooth body-weight fluctuations (water, glycogen, gut content)
 * before computing energy balance from the delta between weight trend and
 * caloric intake.
 *
 * Reference: MacroFactor / Adaptive TDEE methodology.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface CalorieEntry {
  date: string;
  calories: number;
}

export interface TDEEEstimate {
  tdee: number | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  weightTrendStart: number | null;
  weightTrendEnd: number | null;
  weightChangePerWeek: number | null;
  averageIntake: number | null;
  trendDirection: "up" | "down" | "stable";
}

export interface NutritionSuggestion {
  type: "warning" | "suggestion" | "info";
  title: string;
  message: string;
  adjustment: number | null; // kcal delta
}

// ── Constants ──────────────────────────────────────────────────────────

const KCAL_PER_KG = 7700;
const DEFAULT_EMA_ALPHA = 0.1;

// ── Core Functions ─────────────────────────────────────────────────────

/**
 * EWMA for body weight (α = 0.1 is very smooth, ideal for daily weigh-ins).
 *
 * Skips null gaps by carrying forward the last trend value.
 */
export function smoothWeightSeries(
  rawWeights: (number | null)[],
  alpha: number = DEFAULT_EMA_ALPHA,
): number[] {
  const result: number[] = [];
  let ema: number | null = null;

  for (const w of rawWeights) {
    if (w === null) {
      if (ema !== null) result.push(ema);
      continue;
    }
    if (ema === null) {
      ema = w;
    } else {
      ema = alpha * w + (1 - alpha) * ema;
    }
    result.push(ema);
  }

  return result;
}

/**
 * Estimate TDEE from weight trend delta and average caloric intake.
 *
 * Formula:
 *   Daily surplus/deficit = (StartTrend − EndTrend) × 7700 / days
 *   TDEE = AverageIntake + surplus/deficit
 *
 * Requires ≥ 3 weight entries and ≥ 3 calorie entries.
 */
export function estimateTDEE(
  weights: WeightEntry[],
  calories: CalorieEntry[],
  lookbackDays: number,
): TDEEEstimate {
  if (weights.length < 3 || calories.length < 3) {
    return {
      tdee: null,
      confidence: "insufficient",
      weightTrendStart: null,
      weightTrendEnd: null,
      weightChangePerWeek: null,
      averageIntake: null,
      trendDirection: "stable",
    };
  }

  // Build daily weight array for lookback window
  const now = new Date();
  const weightMap = new Map<string, number>();
  for (const w of weights) weightMap.set(w.date, w.weight);

  const dailyRaw: (number | null)[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyRaw.push(weightMap.get(key) ?? null);
  }

  const trend = smoothWeightSeries(dailyRaw, DEFAULT_EMA_ALPHA);
  if (trend.length < 2) {
    return {
      tdee: null,
      confidence: "insufficient",
      weightTrendStart: null,
      weightTrendEnd: null,
      weightChangePerWeek: null,
      averageIntake: null,
      trendDirection: "stable",
    };
  }

  const startTrend = trend[0];
  const endTrend = trend[trend.length - 1];
  const weightChange = endTrend - startTrend;

  // Find actual span between first and last raw measurement
  const firstIdx = dailyRaw.findIndex((w) => w !== null);
  const lastIdx = dailyRaw.length - 1 - [...dailyRaw].reverse().findIndex((w) => w !== null);
  const actualDays = Math.max(lastIdx - firstIdx, 1);

  const weightChangePerWeek = (weightChange / actualDays) * 7;

  // Average calorie intake
  const totalCal = calories.reduce((s, c) => s + c.calories, 0);
  const avgIntake = Math.round(totalCal / calories.length);

  // TDEE = intake + deficit (if losing, deficit is positive)
  const deficit = ((startTrend - endTrend) * KCAL_PER_KG) / actualDays;
  const tdee = Math.round(avgIntake + deficit);

  // Confidence
  const daysWithWeight = dailyRaw.filter((w) => w !== null).length;
  let confidence: TDEEEstimate["confidence"];
  if (daysWithWeight >= 10 && calories.length >= 10) confidence = "high";
  else if (daysWithWeight >= 7 && calories.length >= 7) confidence = "medium";
  else confidence = "low";

  const trendDirection: TDEEEstimate["trendDirection"] =
    weightChange < -0.1 ? "down" : weightChange > 0.1 ? "up" : "stable";

  return {
    tdee,
    confidence,
    weightTrendStart: Math.round(startTrend * 10) / 10,
    weightTrendEnd: Math.round(endTrend * 10) / 10,
    weightChangePerWeek: Math.round(weightChangePerWeek * 100) / 100,
    averageIntake: avgIntake,
    trendDirection,
  };
}

/**
 * Generate a coaching suggestion based on current TDEE estimate and goal.
 */
export function generateNutritionSuggestion(
  goal: "cut" | "maintain" | "bulk",
  weightChangePerWeek: number | null,
  tdee: number | null,
  currentIntake: number | null,
): NutritionSuggestion | null {
  if (weightChangePerWeek === null || tdee === null) return null;

  const absChange = Math.abs(weightChangePerWeek);

  if (goal === "cut") {
    if (absChange < 0.15 && weightChangePerWeek >= -0.15) {
      return {
        type: "suggestion",
        title: "Plateau rilevato",
        message: `Perdita settimanale solo ${absChange.toFixed(2)} kg. Riduci di 150 kcal.`,
        adjustment: -150,
      };
    }
    if (weightChangePerWeek < -1.0) {
      return {
        type: "warning",
        title: "Perdita troppo rapida",
        message: `Stai perdendo ${absChange.toFixed(1)} kg/sett. Aumenta di 200 kcal per preservare massa muscolare.`,
        adjustment: 200,
      };
    }
  }

  if (goal === "bulk") {
    if (absChange < 0.08 && weightChangePerWeek <= 0.08) {
      return {
        type: "suggestion",
        title: "Crescita insufficiente",
        message: "Aggiungi 100 kcal per sostenere la crescita muscolare.",
        adjustment: 100,
      };
    }
    if (weightChangePerWeek > 0.5) {
      return {
        type: "warning",
        title: "Surplus eccessivo",
        message: `Guadagno di ${weightChangePerWeek.toFixed(1)} kg/sett. Riduci di 150 kcal.`,
        adjustment: -150,
      };
    }
  }

  // Compliance check
  if (currentIntake !== null && tdee > 0) {
    const targetMap = { cut: tdee - 550, maintain: tdee, bulk: tdee + 275 };
    const target = targetMap[goal];
    const variance = ((currentIntake - target) / target) * 100;
    if (Math.abs(variance) > 10) {
      return {
        type: "info",
        title: "Intake fuori target",
        message: `Sei ${variance > 0 ? "sopra" : "sotto"} del ${Math.abs(Math.round(variance))}% rispetto al target.`,
        adjustment: null,
      };
    }
  }

  return null;
}
