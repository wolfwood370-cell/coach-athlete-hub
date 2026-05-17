/**
 * src/stores/useAthleteReadinessStore.ts
 * ---------------------------------------------------------------------------
 * Zustand store for the athlete's daily "Prontezza" (readiness) state.
 *
 * Responsibilities
 * ----------------
 * 1. Track whether the user has logged their daily check-in
 *    (`isCompletedToday`) and the resulting composite score
 *    (`dailyScore`, 0..100) that the AthleteDashboard's ring renders.
 * 2. Hold today's AND yesterday's per-metric values (`metrics[key].today`
 *    + `.yesterday`) so the dashboard mini-rows can render a trend icon
 *    (up / down / flat) without a separate hook.
 * 3. Hold the user's three preferred metric keys for the dashboard
 *    surface (`selectedDashboardMetrics`) so the Prontezza card can be
 *    personalised. Defaults to ['Sonno', 'Stress', 'Fatica'] per brief.
 *
 * Non-responsibilities
 * --------------------
 * - Server persistence. Saving to Supabase happens via a dedicated hook
 *   in a follow-up commit; this store is the offline-safe staging
 *   buffer + the source of truth for the dashboard's live read.
 * - Score math. `submitDailyCheckin` currently mints a mock score of
 *   85; the real composite (weighted average + neurotype modifier)
 *   lives in `src/lib/readiness/composite.ts` and will be plumbed in
 *   the data-layer commit.
 *
 * Design notes
 * ------------
 * - Zustand 5 + immer middleware (consistent with
 *   useAthleteWorkoutStore / useProgramBuilderStore / useMovementStore).
 * - `persist` middleware writes to localStorage under
 *   "athlete-readiness-storage". Logout should add this key to the
 *   cleanup list in `useAuth.signOut` (see follow-up).
 * - `submitDailyCheckin` accepts a partial map — callers don't have to
 *   pass every metric. Missing keys keep their previous `today` value
 *   if any, otherwise stay null.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Domain types — exported so consumers can build typed payloads.
// ---------------------------------------------------------------------------

export const METRIC_KEYS = [
  "Sonno",
  "Stress",
  "Fatica",
  "Soreness",
  "Umore",
  "Digestione",
  "HRV",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

/** Today / yesterday snapshot of a single metric. */
export interface MetricSnapshot {
  /** Today's value, 0..10 scale. Null until submitted. */
  today: number | null;
  /** Yesterday's value, 0..10. Mock-seeded for now. */
  yesterday: number | null;
}

export type MetricsMap = Record<MetricKey, MetricSnapshot>;

// ---------------------------------------------------------------------------
// Mock seed for yesterday — replaced by a real query once the data
// layer lands. Keeping these in 0..10 scale so the trend math is
// boring and obvious.
// ---------------------------------------------------------------------------
const MOCK_YESTERDAY: Record<MetricKey, number> = {
  Sonno: 7,
  Stress: 5,
  Fatica: 6,
  Soreness: 6,
  Umore: 8,
  Digestione: 7,
  HRV: 65,
};

const buildInitialMetrics = (): MetricsMap => {
  const map = {} as MetricsMap;
  for (const key of METRIC_KEYS) {
    map[key] = { today: null, yesterday: MOCK_YESTERDAY[key] };
  }
  return map;
};

const DEFAULT_DASHBOARD_METRICS: MetricKey[] = ["Sonno", "Stress", "Fatica"];

// ---------------------------------------------------------------------------
// Store contract
// ---------------------------------------------------------------------------

export interface AthleteReadinessStoreState {
  /** Composite 0..100 score. Null until the day's check-in is submitted. */
  dailyScore: number | null;
  /** True once `submitDailyCheckin` has been called today. */
  isCompletedToday: boolean;
  /** Per-metric today/yesterday values. */
  metrics: MetricsMap;
  /**
   * Three metric keys to render on the dashboard Prontezza card.
   * Length is intentionally NOT enforced at the type level (a future
   * "show 5" mode is plausible) but `setSelectedMetrics` clamps to 3
   * to match the current dashboard surface.
   */
  selectedDashboardMetrics: MetricKey[];

  // ---- Actions -----------------------------------------------------------
  /**
   * Submits the daily check-in. Merges supplied per-metric values into
   * `metrics[*].today`, computes the composite score (mock=85 for now)
   * and flips `isCompletedToday` to true.
   *
   * Values not supplied keep their previous today (typically null on a
   * fresh day). Callers can pass `null` for an explicit "not measured".
   */
  submitDailyCheckin: (payload: Partial<Record<MetricKey, number | null>>) => void;
  /** Replace the three metrics to surface on the dashboard card. */
  setSelectedMetrics: (next: MetricKey[]) => void;
  /** Reset to a fresh day — used by QA and on manual logout. */
  resetDay: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAthleteReadinessStore = create<AthleteReadinessStoreState>()(
  persist(
    immer((set) => ({
      dailyScore: null,
      isCompletedToday: false,
      metrics: buildInitialMetrics(),
      selectedDashboardMetrics: DEFAULT_DASHBOARD_METRICS,

      submitDailyCheckin: (payload) =>
        set((s) => {
          for (const key of METRIC_KEYS) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
              const value = payload[key];
              s.metrics[key].today = value === undefined ? null : value;
            }
          }
          // Mock composite score for now. Real implementation will
          // weight Sonno + HRV most heavily and modulate by Fatica /
          // Soreness — that lives in the data-layer commit.
          s.dailyScore = 85;
          s.isCompletedToday = true;
        }),

      setSelectedMetrics: (next) =>
        set((s) => {
          // Clamp to the first 3 unique keys to keep the dashboard
          // surface consistent. Anything not in METRIC_KEYS is dropped.
          const seen = new Set<MetricKey>();
          const cleaned: MetricKey[] = [];
          for (const k of next) {
            if (
              (METRIC_KEYS as readonly string[]).includes(k) &&
              !seen.has(k)
            ) {
              cleaned.push(k);
              seen.add(k);
              if (cleaned.length === 3) break;
            }
          }
          if (cleaned.length > 0) {
            s.selectedDashboardMetrics = cleaned;
          }
        }),

      resetDay: () =>
        set((s) => {
          s.dailyScore = null;
          s.isCompletedToday = false;
          s.metrics = buildInitialMetrics();
        }),
    })),
    {
      name: "athlete-readiness-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        dailyScore: s.dailyScore,
        isCompletedToday: s.isCompletedToday,
        metrics: s.metrics,
        selectedDashboardMetrics: s.selectedDashboardMetrics,
      }),
    },
  ),
);
