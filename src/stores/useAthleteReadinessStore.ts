/**
 * src/stores/useAthleteReadinessStore.ts
 * ---------------------------------------------------------------------------
 * Zustand store for the athlete's daily "Prontezza" (readiness) UI state.
 *
 * Scope after the data-layer refactor
 * ------------------------------------
 * This store now holds ONLY local, UI-only state:
 *
 *   1. `metrics` — today/yesterday per-metric snapshots used by the
 *      dashboard's mini trend rows. Today is updated via
 *      `submitDailyCheckin` for snappy feedback before the DB round-trip
 *      completes; yesterday is mock-seeded until a server-side
 *      "previous day" query lands.
 *   2. `selectedDashboardMetrics` — the three keys the athlete wants to
 *      pin on the dashboard's Prontezza card. Pure UI personalisation.
 *
 * What moved OUT of this store
 * ----------------------------
 *   - `dailyScore` and `isCompletedToday`: now derived from
 *     `useDailyReadinessQuery(today)` in components that need them.
 *     The DB is the source of truth for "did the athlete check in today
 *     and what was the composite score".
 *   - Server persistence: handled by `useSubmitReadinessMutation` in
 *     `src/hooks/athlete/useAthleteReadinessHooks.ts`.
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
// Mock seed for yesterday — replaced by a real query once the previous-day
// hook lands. Keeping these in 0..10 scale so the trend math is boring
// and obvious.
// ---------------------------------------------------------------------------
const MOCK_YESTERDAY: Record<MetricKey, number> = {
  Sonno: 7,
  Stress: 5,
  Fatica: 6,
  Soreness: 6,
  Umore: 8,
  Digestione: 7,
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
  /** Per-metric today/yesterday values for the dashboard trend rows. */
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
   * Merge the supplied per-metric values into `metrics[*].today`. Used
   * by the DailyCheckin form for snappy local UI feedback in parallel
   * with the server mutation in `useSubmitReadinessMutation`.
   *
   * Values not supplied keep their previous today. Callers can pass
   * `null` for an explicit "not measured".
   */
  submitDailyCheckin: (
    payload: Partial<Record<MetricKey, number | null>>,
  ) => void;
  /** Replace the three metrics to surface on the dashboard card. */
  setSelectedMetrics: (next: MetricKey[]) => void;
  /** Reset the local today snapshots — used by QA and on manual logout. */
  resetDay: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAthleteReadinessStore = create<AthleteReadinessStoreState>()(
  persist(
    immer((set) => ({
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
          s.metrics = buildInitialMetrics();
        }),
    })),
    {
      name: "athlete-readiness-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        metrics: s.metrics,
        selectedDashboardMetrics: s.selectedDashboardMetrics,
      }),
    },
  ),
);
