// =============================================================================
// src/hooks/athlete/useAthleteWorkoutHooks.ts
// =============================================================================
// React Query hooks for athlete workout sessions and per-set logging.
//
// Data model:
//   - `workout_logs` row  = one session header (start/end/elapsed/RPE/notes).
//   - `exercise_logs` rows = one row per completed set, FK'd to the session.
//
// Hooks:
//   - useStartSessionMutation  → INSERT workout_logs, status='in_progress'.
//   - useLogSetMutation        → INSERT exercise_logs (one set).
//   - useFinishSessionMutation → UPDATE workout_logs with end/duration/RPE/notes.
//   - useSessionSetsQuery      → SELECT exercise_logs for a session.
//
// `workout_logs.workout_id` is nullable (see migration
// 20260517171000_workout_logs_optional_workout.sql) so freestyle sessions
// without a coach-prescribed `workouts` row can still be persisted.
// =============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";

export type WorkoutLogRow = Tables<"workout_logs">;
export type ExerciseLogRow = Tables<"exercise_logs">;

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const sessionSetsKey = (sessionId: string | null) =>
  ["session-sets", sessionId ?? "none"] as const;

// ---------------------------------------------------------------------------
// Start session
// ---------------------------------------------------------------------------

export interface StartSessionInput {
  /** Optional FK to a coach-prescribed workouts row. Null for freestyle. */
  workout_id?: string | null;
}

/**
 * Build a synthetic, local-only `workout_logs` row used when no Supabase
 * session is available (typically: dev / local testing without auth).
 *
 * Both `id` and `athlete_id` MUST be valid UUIDs (not prefixed strings)
 * because their TS types are `string` but the underlying Postgres
 * columns are `uuid`. Any downstream `.eq("id", row.id)` query would
 * otherwise fail with "invalid input syntax for type uuid".
 *
 * No DB INSERT happens here — the caller just uses the synthetic id
 * locally; set-logging mutations will FK-fail against `exercise_logs`
 * (no parent workout_logs row in DB) and surface a toast.
 */
function makeLocalSessionRow(workoutId: string | null): WorkoutLogRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    athlete_id: crypto.randomUUID(),
    workout_id: workoutId,
    started_at: now,
    completed_at: null,
    created_at: now,
    duration_minutes: null,
    duration_seconds: null,
    exercises_data: [],
    google_event_id: null,
    local_id: null,
    notes: null,
    program_id: null,
    program_workout_id: null,
    rpe_global: null,
    scheduled_date: null,
    scheduled_start_time: null,
    srpe: null,
    coach_feedback: null,
    coach_feedback_at: null,
    status: "in_progress",
    sync_status: "pending",
    total_load_au: null,
  };
}

/**
 * Insert a new `workout_logs` row in `in_progress` state, stamped with
 * `started_at = now()`. Returns the new row so the caller can stash the
 * session id (used as the FK target for `exercise_logs`).
 *
 * Local-only fallback: when no authenticated user is present, returns a
 * synthetic row instead of throwing. This lets the local Zustand state
 * boot a visible session for QA / dev without backend, without firing
 * a blocking error toast on every cold start.
 */
export function useStartSessionMutation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: StartSessionInput = {}): Promise<WorkoutLogRow> => {
      if (!user?.id) {
        console.warn(
          "[useStartSessionMutation] No authenticated user — falling back to local-only session.",
        );
        return makeLocalSessionRow(input.workout_id ?? null);
      }
      const payload: TablesInsert<"workout_logs"> = {
        athlete_id: user.id,
        workout_id: input.workout_id ?? null,
        started_at: new Date().toISOString(),
        status: "in_progress",
      };
      const { data, error } = await supabase
        .from("workout_logs")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast.error("Avvio sessione fallito", {
        description: error.message,
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Log a set
// ---------------------------------------------------------------------------

export interface LogSetInput {
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  is_completed?: boolean;
}

/**
 * Insert one `exercise_logs` row for the active session. Invalidates the
 * session's sets query on success so the UI's completed-count refreshes.
 */
export function useLogSetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogSetInput): Promise<ExerciseLogRow> => {
      const payload: TablesInsert<"exercise_logs"> = {
        session_id: input.session_id,
        exercise_id: input.exercise_id,
        set_number: input.set_number,
        weight: input.weight,
        reps: input.reps,
        is_completed: input.is_completed ?? true,
      };
      const { data, error } = await supabase
        .from("exercise_logs")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({
        queryKey: sessionSetsKey(row.session_id),
      });
    },
    onError: (error: Error) => {
      toast.error("Salvataggio serie fallito", {
        description: error.message,
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Finish session
// ---------------------------------------------------------------------------

export interface FinishSessionInput {
  session_id: string;
  duration_seconds: number;
  rpe_global?: number | null;
  notes?: string | null;
}

/**
 * Mark a session complete — stamps `completed_at`, persists final
 * duration / RPE / notes, flips status to 'completed'.
 */
export function useFinishSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FinishSessionInput): Promise<WorkoutLogRow> => {
      const update: TablesUpdate<"workout_logs"> = {
        completed_at: new Date().toISOString(),
        duration_seconds: input.duration_seconds,
        rpe_global: input.rpe_global ?? null,
        notes: input.notes ?? null,
        status: "completed",
      };
      const { data, error } = await supabase
        .from("workout_logs")
        .update(update)
        .eq("id", input.session_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({
        queryKey: sessionSetsKey(row.id),
      });
    },
    onError: (error: Error) => {
      toast.error("Chiusura sessione fallita", {
        description: error.message,
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Read: sets in a session
// ---------------------------------------------------------------------------

/**
 * Fetch all `exercise_logs` rows for a session, ordered by set_number.
 * Disabled while `sessionId` is null (no active session).
 */
export function useSessionSetsQuery(sessionId: string | null) {
  return useQuery({
    queryKey: sessionSetsKey(sessionId),
    queryFn: async (): Promise<ExerciseLogRow[]> => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("session_id", sessionId)
        .order("set_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(sessionId),
  });
}
