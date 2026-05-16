/**
 * src/stores/useAthleteWorkoutStore.ts
 * ---------------------------------------------------------------------------
 * Zustand store managing an active in-session athlete workout — the shared
 * source of truth that lives between AthleteTraining, ActiveWorkout, the
 * protocol execution drawers, and the post-workout debrief.
 *
 * Responsibilities
 * ----------------
 * 1. Track whether a session is currently running (`isSessionActive`).
 * 2. Hold the live elapsed seconds counter (`elapsedTime`), incremented
 *    by an external 1Hz tick (the ActiveWorkout component owns the
 *    setInterval; the store just integrates the ticks).
 * 3. Persist the per-exercise set log the athlete has entered
 *    (`workoutData.exercises[exerciseId].sets[setIndex]`).
 * 4. Survive page reloads by persisting to localStorage under the
 *    historical `active-workout-storage` key (the same key that
 *    useAuth.signOut already clears, so logout still wipes everything).
 *
 * Non-responsibilities
 * --------------------
 * - The interval itself. We deliberately do NOT call setInterval inside
 *   the store action: that would survive React tree teardown and leak.
 *   The component that owns the visible timer (ActiveWorkout) installs
 *   the interval, calls `tick()` once per second, and tears it down on
 *   unmount or pause.
 * - Auth wiring. The store is athlete-id-agnostic in this commit; when
 *   the data layer lands the next pass will couple it to useAuth.user.id
 *   so an in-progress session cannot bleed across user accounts.
 * - Server persistence. Saving to Supabase happens via a dedicated hook
 *   in the next commit; this store is the offline-safe staging buffer.
 *
 * Design notes
 * ------------
 * - Zustand 5 + immer middleware (matches useProgramBuilderStore /
 *   useMovementStore conventions already in this codebase).
 * - `persist` middleware writes to localStorage. We reuse the key
 *   `active-workout-storage` that already exists in useAuth.signOut, so
 *   a fresh signup-out-sign-in cycle reliably starts clean.
 * - All mutators use immer's draft API so deeply-nested updates
 *   (`workoutData.exercises[id].sets[i]`) stay readable.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** A single completed set inside the live workout log. */
export interface SetEntry {
  /** Reps actually performed. Integer. */
  reps: number;
  /** Weight in kilograms. Decimal (steps of 0.5kg are common). */
  weight: number;
  /** Epoch ms when this set was logged — useful for stale-set audits. */
  loggedAt: number;
}

/** All sets recorded for one exercise in this session. */
export interface ExerciseLog {
  exerciseId: string;
  sets: SetEntry[];
}

/** Top-level shape of the session payload. */
export interface WorkoutData {
  /** Map of exerciseId → log. Map-of-id rather than array so updates
   *  by id are O(1) and order is decided by the UI / programme schema,
   *  not by insertion order. */
  exercises: Record<string, ExerciseLog>;
}

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
  /** Per-exercise sets recorded so far. */
  workoutData: WorkoutData;

  // ---- Actions -----------------------------------------------------------
  /** Begin a fresh session — clears any prior state and stamps startedAt. */
  startSession: () => void;
  /** End the session and clear all in-memory state. */
  stopSession: () => void;
  /** 1Hz tick — call from the timer component's setInterval. No-op when
   *  the session is not active (defensive: prevents drift if the
   *  component forgot to clear its interval). */
  tick: () => void;
  /**
   * Replace the `setIndex` entry for `exerciseId` with the supplied
   * reps/weight. Auto-creates the exercise log and pads empty sets up
   * to setIndex so callers can update any set without precondition.
   */
  updateSetData: (
    exerciseId: string,
    setIndex: number,
    reps: number,
    weight: number,
  ) => void;
}

// ---------------------------------------------------------------------------
// Internal defaults
// ---------------------------------------------------------------------------

const EMPTY_SESSION = {
  isSessionActive: false,
  elapsedTime: 0,
  startedAt: null as number | null,
  workoutData: { exercises: {} as Record<string, ExerciseLog> },
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAthleteWorkoutStore = create<AthleteWorkoutStoreState>()(
  persist(
    immer((set) => ({
      ...EMPTY_SESSION,

      startSession: () =>
        set((s) => {
          s.isSessionActive = true;
          s.elapsedTime = 0;
          s.startedAt = Date.now();
          s.workoutData = { exercises: {} };
        }),

      stopSession: () =>
        set((s) => {
          s.isSessionActive = false;
          s.elapsedTime = 0;
          s.startedAt = null;
          s.workoutData = { exercises: {} };
        }),

      tick: () =>
        set((s) => {
          // Guard so a stale interval (e.g. left running after a manual
          // stopSession) cannot keep mutating state.
          if (s.isSessionActive) {
            s.elapsedTime += 1;
          }
        }),

      updateSetData: (exerciseId, setIndex, reps, weight) =>
        set((s) => {
          if (!s.workoutData.exercises[exerciseId]) {
            s.workoutData.exercises[exerciseId] = {
              exerciseId,
              sets: [],
            };
          }
          const log = s.workoutData.exercises[exerciseId];
          // Pad up to and including setIndex so we can write any index
          // without callers having to pre-add intermediate sets.
          while (log.sets.length <= setIndex) {
            log.sets.push({ reps: 0, weight: 0, loggedAt: 0 });
          }
          log.sets[setIndex] = {
            reps,
            weight,
            loggedAt: Date.now(),
          };
        }),
    })),
    {
      // Historical key — useAuth.signOut already cleans this on logout.
      name: "active-workout-storage",
      storage: createJSONStorage(() => localStorage),
      // Persist only the durable pieces; selectors / actions are
      // recomputed on every page load.
      partialize: (s) => ({
        isSessionActive: s.isSessionActive,
        elapsedTime: s.elapsedTime,
        startedAt: s.startedAt,
        workoutData: s.workoutData,
      }),
    },
  ),
);
