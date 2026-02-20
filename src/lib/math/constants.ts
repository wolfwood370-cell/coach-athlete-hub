// ── Data-Science Baseline Constants ────────────────────────────────────
// Central source of truth for observation windows used across the app.

/** ACWR chronic window (days) — Hulin et al. coupled model */
export const ACWR_BASELINE_DAYS = 28;

/** Minimum days of wearable data (HRV, RHR) before computing Z-Score baselines */
export const WEARABLES_BASELINE_DAYS = 14;

/** Nutrition rolling window for adaptive TDEE estimation */
export const NUTRITION_BASELINE_DAYS = 21;

/** Total lookback for ACWR daily-load array (6 weeks) */
export const ACWR_LOOKBACK_DAYS = 42;

/** Readiness rolling baseline window */
export const READINESS_BASELINE_DAYS = 30;
