/**
 * src/stores/useAthleteWorkoutStore.ts
 * ---------------------------------------------------------------------------
 * Zustand store for the active athlete workout — local UI state only.
 *
 * Scope after the data-layer refactor
 * ------------------------------------
 * This store holds ONLY UI state that is not naturally a DB column:
 *
 *   1. `isSessionActive` + `elapsedTime` + `startedAt` — the visible
 *      stopwatch driven by ActiveWorkout's 1Hz tick.
 *   2. `activeSessionId` — local handle to the `workout_logs.id` we
 *      INSERTed at session start. Persisted so a page reload doesn't
 *      orphan the in-progress session.
 *
 * What moved OUT of this store
 * ----------------------------
 *   - `loggedSets` + `logSet`: per-set data now lives in the
 *     `exercise_logs` table. Reads use `useSessionSetsQuery(sessionId)`
 *     and writes use `useLogSetMutation()` from
 *     `src/hooks/athlete/useAthleteWorkoutHooks.ts`.
 *
 * Design notes
 * ------------
 * - The interval lives in the component that owns the visible timer
 *   (ActiveWorkout); the store just integrates the ticks.
 * - `persist` middleware writes to localStorage under the historical
 *   `active-workout-storage` key (still cleared by useAuth.signOut).
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Store contract
// ---------------------------------------------------------------------------

export interface AthleteWorkoutStoreState {
  /** True while a workout session is running (paused or active). */
  isSessionActive: boolean;
  /** Live elapsed seconds since `startSession`. Incremented by `tick`. */
  elapsedTime: number;
  /**
   * Epoch ms when the session started. Kept in addition to `elapsedTime`
   * so a future "resume on reload" pass can recompute the real elapsed
   * time from wall-clock instead of trusting only the integrated ticks
   * (which freeze when the tab is backgrounded on mobile).
   */
  startedAt: number | null;
  /**
   * The `workout_logs.id` of the in-progress session. Set by
   * `startSession(id)` after the DB INSERT returns; cleared by
   * `stopSession()`. Components key set-log queries / mutations off
   * this id.
   */
  activeSessionId: string | null;

  // ---- Actions -----------------------------------------------------------
  /**
   * Mark a session active — pass the `workout_logs.id` returned by
   * `useStartSessionMutation`. Resets the elapsed timer so the visible
   * stopwatch starts at 00:00.
   */
  startSession: (sessionId: string) => void;
  /** End the session and clear all in-memory state. */
  stopSession: () => void;
  /** 1Hz tick — call from the timer component's setInterval. No-op when
   *  the session is not active. */
  tick: () => void;
}

// ---------------------------------------------------------------------------
// Internal defaults
// ---------------------------------------------------------------------------

const EMPTY_SESSION = {
  isSessionActive: false,
  elapsedTime: 0,
  startedAt: null as number | null,
  activeSessionId: null as string | null,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAthleteWorkoutStore = create<AthleteWorkoutStoreState>()(
  persist(
    immer((set) => ({
      ...EMPTY_SESSION,

      startSession: (sessionId) =>
        set((s) => {
          s.isSessionActive = true;
          s.elapsedTime = 0;
          s.startedAt = Date.now();
          s.activeSessionId = sessionId;
        }),

      stopSession: () =>
        set((s) => {
          s.isSessionActive = false;
          s.elapsedTime = 0;
          s.startedAt = null;
          s.activeSessionId = null;
        }),

      tick: () =>
        set((s) => {
          if (s.isSessionActive) {
            s.elapsedTime += 1;
          }
        }),
    })),
    {
      name: "active-workout-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        isSessionActive: s.isSessionActive,
        elapsedTime: s.elapsedTime,
        startedAt: s.startedAt,
        activeSessionId: s.activeSessionId,
      }),
    },
  ),
);
