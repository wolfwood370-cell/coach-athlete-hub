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
 *   2. `activeSessionId` — in-memory handle to the `workout_logs.id`
 *      we INSERTed at session start. NOT persisted (see Persistence
 *      below) — that would leak stale ids across page reloads and
 *      make exercises appear pre-completed before the mount effect
 *      could reset them.
 *
 * What moved OUT of this store
 * ----------------------------
 *   - `loggedSets` + `logSet`: per-set data now lives in the
 *     `exercise_logs` table. Reads use `useSessionSetsQuery(sessionId)`
 *     and writes use `useLogSetMutation()` from
 *     `src/hooks/athlete/useAthleteWorkoutHooks.ts`. Because the DB
 *     is the source of truth, the equivalent of "reset loggedSets to
 *     {}" on startSession is naturally guaranteed: a fresh
 *     `activeSessionId` means `useSessionSetsQuery` returns an empty
 *     array until sets are logged through `useLogSetMutation`.
 *
 * Persistence
 * -----------
 * - `partialize` deliberately EXCLUDES `activeSessionId` so a refresh
 *   never reanimates a previous session's id. The ActiveWorkout mount
 *   effect always issues a fresh `useStartSessionMutation`.
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
          // ---- Strict clean-slate guarantee ----------------------------
          // Every field is reset to its empty default before the freshly
          // started ones are overwritten. No mock data is loaded, no
          // residue from a previous session (paused timer, leftover
          // elapsed seconds, stale `activeSessionId`) can leak in.
          //
          // The per-set ledger has been removed from this store: sets
          // live in the `exercise_logs` table and are read via
          // `useSessionSetsQuery(activeSessionId)`. A fresh `sessionId`
          // implicitly produces an empty result set for that query —
          // exactly the "loggedSets: {}" semantic the legacy store had.
          s.isSessionActive = EMPTY_SESSION.isSessionActive;
          s.elapsedTime = EMPTY_SESSION.elapsedTime;
          s.startedAt = EMPTY_SESSION.startedAt;
          s.activeSessionId = EMPTY_SESSION.activeSessionId;

          // Apply only the fields that distinguish a started session.
          s.isSessionActive = true;
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
        // activeSessionId intentionally NOT persisted — see header
        // docblock. Stale session ids leaking across reloads were the
        // root cause of the "Phase 1 pre-completed" bug.
      }),
    },
  ),
);
