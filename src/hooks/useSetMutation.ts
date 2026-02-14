import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSessionStore } from "@/stores/useActiveSessionStore";
import { toast } from "sonner";

interface SetPayload {
  exerciseId: string;
  setIndex: number;
  field: string;
  value: string | boolean;
}

/**
 * Optimistic mutation for logging individual set fields.
 * Updates the Zustand store instantly (onMutate) and rolls back on error.
 */
export function useSetMutation() {
  const queryClient = useQueryClient();
  const updateSetField = useActiveSessionStore((s) => s.updateSetField);
  const completeSet = useActiveSessionStore((s) => s.completeSet);

  return useMutation({
    mutationFn: async (payload: SetPayload) => {
      // The actual DB write happens at session-end (bulk save).
      // This mutation is for local-first persistence via the Zustand store.
      // We treat it as a no-op server call; real sync is batched.
      return payload;
    },

    onMutate: async (payload) => {
      const { exerciseId, setIndex, field, value } = payload;

      // Snapshot for rollback
      const prevLogs = useActiveSessionStore.getState().sessionLogs;

      // Optimistic update
      if (field === "completed" && value === true) {
        const logs = useActiveSessionStore.getState().sessionLogs[exerciseId] ?? [];
        const current = logs.find((l) => l.setIndex === setIndex);
        completeSet(exerciseId, setIndex, {
          actualKg: current?.actualKg ?? "",
          actualReps: current?.actualReps ?? "",
          rpe: current?.rpe ?? "",
          completed: true,
        });
      } else {
        updateSetField(exerciseId, setIndex, field as any, value);
      }

      return { prevLogs };
    },

    onError: (_err, _payload, context) => {
      // Rollback to snapshot
      if (context?.prevLogs) {
        useActiveSessionStore.setState({ sessionLogs: context.prevLogs });
      }
      toast.error("Errore di sincronizzazione set");
    },

    onSettled: () => {
      // Invalidate workout-related queries on settle
      queryClient.invalidateQueries({ queryKey: ["athlete-today-workout"] });
    },
  });
}
