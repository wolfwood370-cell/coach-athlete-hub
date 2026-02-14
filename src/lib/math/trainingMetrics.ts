/**
 * Training Metrics — Pure math utilities for workload management.
 *
 * EWMA (Exponentially Weighted Moving Average) is used instead of SMA
 * because it weights recent data more heavily, reacting faster to load
 * spikes while still smoothing noise.
 *
 * ACWR uses the "Coupled" model: acute window is included in the chronic
 * calculation, matching the validated Hulin et al. (2014) methodology.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface DailyLoad {
  date: string; // YYYY-MM-DD
  load: number; // arbitrary units (e.g. Volume × RPE)
}

export type AcwrZone = "detraining" | "optimal" | "warning" | "high-risk" | "insufficient-data";

export interface AcwrResult {
  ratio: number | null;
  acuteLoad: number;
  chronicLoad: number;
  zone: AcwrZone;
  label: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const ACUTE_WINDOW = 7;
const CHRONIC_WINDOW = 28;
const EWMA_ALPHA_ACUTE = 2 / (ACUTE_WINDOW + 1);   // ~0.25
const EWMA_ALPHA_CHRONIC = 2 / (CHRONIC_WINDOW + 1); // ~0.069

// ── Core Functions ─────────────────────────────────────────────────────

/**
 * Exponentially Weighted Moving Average.
 *
 * Formula: EWMA_t = α × value_t + (1 − α) × EWMA_(t−1)
 *
 * @param values  Chronologically ordered array (oldest → newest).
 * @param alpha   Smoothing factor (0 < α ≤ 1). Higher = more reactive.
 * @returns       The final EWMA value, or 0 if no values.
 */
export function calculateEWMA(values: number[], alpha: number): number {
  if (values.length === 0) return 0;

  let ewma = values[0]; // seed with first value
  for (let i = 1; i < values.length; i++) {
    ewma = alpha * values[i] + (1 - alpha) * ewma;
  }
  return ewma;
}

/**
 * Calculate daily strain (load) for a single session.
 *
 * Strain = Total Volume × Session RPE
 * Where Total Volume = Σ(sets × reps × weight) for all exercises.
 *
 * Falls back to RPE × duration (minutes) when volume data is unavailable.
 */
export function calculateDailyStrain(
  totalVolume: number | null,
  rpe: number | null,
  durationSeconds: number | null,
): number {
  const safeRpe = rpe ?? 5; // neutral default

  if (totalVolume !== null && totalVolume > 0) {
    return totalVolume * safeRpe;
  }

  // Fallback: sRPE method (RPE × minutes)
  if (durationSeconds !== null && durationSeconds > 0) {
    return safeRpe * (durationSeconds / 60);
  }

  return 0;
}

/**
 * Generate an array of daily totals for a date range, filling gaps with 0.
 * Input loads can have multiple entries per day (they are summed).
 */
export function buildDailyLoadArray(
  loads: DailyLoad[],
  days: number,
): number[] {
  const now = new Date();
  const map = new Map<string, number>();

  for (const l of loads) {
    map.set(l.date, (map.get(l.date) ?? 0) + l.load);
  }

  const result: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push(map.get(key) ?? 0);
  }

  return result;
}

/**
 * Calculate Acute:Chronic Workload Ratio using EWMA (Coupled model).
 *
 * Requires ≥ 14 days of history for a meaningful chronic window.
 * With < 14 days, returns ratio = null with "insufficient-data" zone.
 *
 * @param dailyLoads  42 days of chronologically ordered daily load values.
 */
export function calculateACWR(dailyLoads: number[]): AcwrResult {
  if (dailyLoads.length < 14) {
    return {
      ratio: null,
      acuteLoad: 0,
      chronicLoad: 0,
      zone: "insufficient-data",
      label: "Dati insufficienti",
    };
  }

  // Compute rolling EWMA for the full series
  const acuteSlice = dailyLoads.slice(-ACUTE_WINDOW);
  const chronicSlice = dailyLoads.slice(-CHRONIC_WINDOW);

  const acuteLoad = calculateEWMA(acuteSlice, EWMA_ALPHA_ACUTE);
  const chronicLoad = calculateEWMA(chronicSlice, EWMA_ALPHA_CHRONIC);

  if (chronicLoad === 0) {
    return {
      ratio: null,
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: 0,
      zone: "insufficient-data",
      label: "Dati insufficienti",
    };
  }

  const ratio = Math.round((acuteLoad / chronicLoad) * 100) / 100;

  let zone: AcwrZone;
  let label: string;

  if (ratio < 0.8) {
    zone = "detraining";
    label = "Detraining";
  } else if (ratio <= 1.3) {
    zone = "optimal";
    label = "Optimal";
  } else if (ratio <= 1.5) {
    zone = "warning";
    label = "Warning";
  } else {
    zone = "high-risk";
    label = "High Risk";
  }

  return {
    ratio,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicLoad),
    zone,
    label,
  };
}
