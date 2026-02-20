// Readiness Math — Statistical normalization utilities v2
// Pure TypeScript, zero dependencies.

import { READINESS_BASELINE_DAYS } from "./constants";

/**
 * Calculate the arithmetic mean of a numeric array.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate the population standard deviation.
 * Uses N (not N-1) since we treat the 30-day window as the full population.
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(mean(squaredDiffs));
}

/**
 * Z-Score: how many standard deviations `current` is from `mean`.
 *
 *   z = (current - mean) / sd
 *
 * Returns 0 when sd is 0 (no variance → on baseline).
 */
export function calculateZScore(
  current: number,
  avg: number,
  sd: number,
): number {
  if (sd === 0) return 0;
  return (current - avg) / sd;
}

/**
 * Linear normalisation of `value` into [0, 100].
 * Clamps the output so it never leaves the 0-100 range.
 */
export function normalizeMetric(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) return 50; // degenerate range → midpoint
  const scaled = ((value - min) / (max - min)) * 100;
  return Math.round(Math.max(0, Math.min(100, scaled)));
}

// ── Readiness-specific helpers ────────────────────────────────────────

export type MetricStatus = "optimal" | "low" | "high";

/**
 * Derive a qualitative status from a Z-Score.
 *
 * | Z-Score          | Status    | Meaning                          |
 * |------------------|-----------|----------------------------------|
 * | z ≥ 0            | optimal   | At or above baseline             |
 * | −1 < z < 0       | optimal   | Slightly below, still normal     |
 * | z ≤ −1           | low       | ≥ 1 SD below baseline            |
 * | z ≥ 1.5          | high      | Unusually elevated (parasym.)    |
 */
export function metricStatusFromZ(z: number): MetricStatus {
  if (z <= -1) return "low";
  if (z >= 1.5) return "high";
  return "optimal";
}

/**
 * Convert an HRV Z-Score into a 0-100 sub-score (60 % weight).
 *
 * Mapping (piecewise linear):
 *   z ≤ −2   →  0
 *   z =  0   → 30   (baseline = midpoint of objective band)
 *   z ≥ +2   → 60
 */
export function hrvZToScore(z: number): number {
  const clamped = Math.max(-2, Math.min(2, z));
  // linear from [-2, +2] → [0, 60]
  return Math.round(((clamped + 2) / 4) * 60);
}

/**
 * Convert a Resting HR Z-Score into a 0-20 sub-score.
 * For RHR, *lower* is better, so we invert the z-score.
 *
 *   z ≤ −2  (much lower than baseline) → 20  (great)
 *   z = 0   → 10
 *   z ≥ +2  (elevated)                 → 0   (bad)
 */
export function rhrZToScore(z: number): number {
  const inverted = -z; // flip: lower HR = positive signal
  const clamped = Math.max(-2, Math.min(2, inverted));
  return Math.round(((clamped + 2) / 4) * 20);
}

/**
 * Map subjective inputs (energy, mood, inverted stress, sleep quality)
 * each on a 1-10 scale, to a 0-20 sub-score.
 */
export function subjectiveToScore(
  energy: number,
  mood: number,
  stress: number,
  sleepQuality: number,
): number {
  const energyNorm = (energy - 1) / 9;
  const moodNorm = (mood - 1) / 9;
  const stressNorm = (10 - stress) / 9; // inverted
  const sqNorm = (sleepQuality - 1) / 9;

  const avg = energyNorm * 0.3 + moodNorm * 0.25 + stressNorm * 0.25 + sqNorm * 0.2;
  return Math.round(avg * 20);
}

// ── Composite score ───────────────────────────────────────────────────

export interface ReadinessBreakdown {
  /** Final 0-100 score */
  score: number;
  /** HRV contribution (0-60) */
  hrvComponent: number;
  /** RHR contribution (0-20) */
  rhrComponent: number;
  /** Subjective contribution (0-20) */
  subjectiveComponent: number;
  /** Z-Scores for transparency */
  hrvZ: number;
  rhrZ: number;
  /** Qualitative statuses */
  hrvStatus: MetricStatus;
  rhrStatus: MetricStatus;
}

/**
 * Compute the composite readiness score.
 *
 * Weighting:
 *   60 %  HRV  (objective, z-score driven)
 *   20 %  RHR  (objective, z-score driven, inverted)
 *   20 %  Subjective  (energy, mood, stress, sleep quality)
 *
 * When HRV/RHR data is unavailable, the subjective portion is
 * scaled up to fill the gap (graceful degradation for new users).
 */
export function computeReadiness(params: {
  hrvToday: number | null;
  hrvMean: number;
  hrvSd: number;
  rhrToday: number | null;
  rhrMean: number;
  rhrSd: number;
  energy: number;
  mood: number;
  stress: number;
  sleepQuality: number;
  hasBaseline: boolean;
}): ReadinessBreakdown {
  const subjective = subjectiveToScore(
    params.energy,
    params.mood,
    params.stress,
    params.sleepQuality,
  );

  // No baseline → subjective-only mode (scaled to 0-100)
  if (!params.hasBaseline) {
    const scaled = Math.round((subjective / 20) * 100);
    return {
      score: scaled,
      hrvComponent: 0,
      rhrComponent: 0,
      subjectiveComponent: subjective,
      hrvZ: 0,
      rhrZ: 0,
      hrvStatus: "optimal",
      rhrStatus: "optimal",
    };
  }

  // HRV component
  let hrvComponent = 30; // neutral default if no today's reading
  let hrvZ = 0;
  if (params.hrvToday !== null && params.hrvSd > 0) {
    hrvZ = calculateZScore(params.hrvToday, params.hrvMean, params.hrvSd);
    hrvComponent = hrvZToScore(hrvZ);
  }

  // RHR component
  let rhrComponent = 10; // neutral default
  let rhrZ = 0;
  if (params.rhrToday !== null && params.rhrSd > 0) {
    rhrZ = calculateZScore(params.rhrToday, params.rhrMean, params.rhrSd);
    rhrComponent = rhrZToScore(rhrZ);
  }

  const total = Math.max(0, Math.min(100, hrvComponent + rhrComponent + subjective));

  return {
    score: total,
    hrvComponent,
    rhrComponent,
    subjectiveComponent: subjective,
    hrvZ,
    rhrZ,
    hrvStatus: metricStatusFromZ(hrvZ),
    rhrStatus: metricStatusFromZ(-rhrZ), // invert for RHR semantics
  };
}

// ── Dynamic Readiness Score (standalone) ──────────────────────────────

export interface ReadinessInputs {
  sleepHours: number;   // 0-24
  stress: number;       // 1-10 (10 = highest stress)
  soreness: number;     // 1-10 (10 = highest soreness)
  mood: number;         // 1-10 (10 = best mood)
  hrv?: number | null;
  rhr?: number | null;
  hrvBaseline?: number | null;
  rhrBaseline?: number | null;
  hrvSd?: number | null;
  rhrSd?: number | null;
}

/**
 * Standalone readiness score with graceful fallback.
 *
 * Subjective-only when no wearable data is present.
 * Blends 50/50 with an objective Z-Score component when HRV/RHR exist.
 *
 * Weights (subjective mode):
 *   40 %  Sleep
 *   20 %  Stress (inverted)
 *   20 %  Soreness (inverted)
 *   20 %  Mood
 */
export function calculateReadinessScore(inputs: ReadinessInputs): number {
  // Sleep (40 %): target 8 h
  const sleepScore = Math.min(100, (inputs.sleepHours / 8) * 100) * 0.40;
  // Stress (20 %): 1 = best, 10 = worst → invert
  const stressScore = ((11 - inputs.stress) * 10) * 0.20;
  // Soreness (20 %): 1 = best, 10 = worst → invert
  const sorenessScore = ((11 - inputs.soreness) * 10) * 0.20;
  // Mood (20 %): 10 = best
  const moodScore = (inputs.mood * 10) * 0.20;

  const subjectiveScore = sleepScore + stressScore + sorenessScore + moodScore;

  // Fallback: subjective-only
  const hasObjective =
    (inputs.hrv != null && inputs.hrvBaseline != null && inputs.hrvSd != null && inputs.hrvSd > 0) ||
    (inputs.rhr != null && inputs.rhrBaseline != null && inputs.rhrSd != null && inputs.rhrSd > 0);

  if (!hasObjective) {
    return Math.round(Math.max(0, Math.min(100, subjectiveScore)));
  }

  // Objective component via Z-Score mapping (reuse existing helpers)
  let objectiveScore = 50; // neutral default
  let objectiveComponents = 0;

  if (inputs.hrv != null && inputs.hrvBaseline != null && inputs.hrvSd != null && inputs.hrvSd > 0) {
    const z = calculateZScore(inputs.hrv, inputs.hrvBaseline, inputs.hrvSd);
    // Map z ∈ [-2, +2] → [0, 100]
    const clamped = Math.max(-2, Math.min(2, z));
    objectiveScore = ((clamped + 2) / 4) * 100;
    objectiveComponents++;
  }

  if (inputs.rhr != null && inputs.rhrBaseline != null && inputs.rhrSd != null && inputs.rhrSd > 0) {
    const z = calculateZScore(inputs.rhr, inputs.rhrBaseline, inputs.rhrSd);
    // For RHR, lower is better → invert
    const inverted = -z;
    const clamped = Math.max(-2, Math.min(2, inverted));
    const rhrScore = ((clamped + 2) / 4) * 100;
    objectiveScore = objectiveComponents > 0
      ? (objectiveScore + rhrScore) / 2
      : rhrScore;
    objectiveComponents++;
  }

  // Blend 50 / 50
  const blended = subjectiveScore * 0.5 + objectiveScore * 0.5;
  return Math.round(Math.max(0, Math.min(100, blended)));
}

/** Re-export baseline constant for convenience */
export { READINESS_BASELINE_DAYS } from "./constants";
