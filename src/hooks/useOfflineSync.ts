import { useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

// ============================================================================
// TYPES - Strict queue for athlete execution data ONLY
// ============================================================================

export interface SetData {
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe?: number;
  completed: boolean;
  [key: string]: Json | undefined;
}

export interface WorkoutExercise {
  exercise_name: string;
  exercise_order: number;
  sets_data: SetData[];
  notes?: string;
}

export interface WorkoutLogPayload {
  type: 'workout_log';
  local_id: string;
  workout_id: string;
  athlete_id: string;
  started_at: string;
  completed_at?: string;
  srpe?: number;
  duration_minutes?: number;
  exercises: WorkoutExercise[];
  notes?: string;
  /** sync_version captured when the athlete started the session */
  device_sync_version?: number;
}

export interface DailyReadinessPayload {
  type: 'daily_readiness';
  local_id: string;
  athlete_id: string;
  date: string;
  sleep_hours?: number;
  sleep_quality?: number;
  energy?: number;
  mood?: number;
  stress_level?: number;
  soreness_map?: Json;
  notes?: string;
}

type QueueItem = {
  id: string;
  payload: WorkoutLogPayload | DailyReadinessPayload;
  timestamp: number;
  retryCount: number;
};

// ============================================================================
// QUEUE STORAGE - Strict localStorage key for athlete workout data only
// ============================================================================

const QUEUE_KEY = 'offline_workout_queue';
const MAX_RETRIES = 3;

export function getQueue(): QueueItem[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[OfflineSync] Failed to save queue:', e);
  }
}

function addToQueue(payload: WorkoutLogPayload | DailyReadinessPayload): void {
  const queue = getQueue();
  queue.push({
    id: payload.local_id,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  });
  saveQueue(queue);
}

function removeFromQueue(id: string): void {
  const queue = getQueue().filter(item => item.id !== id);
  saveQueue(queue);
}

function incrementRetry(id: string): void {
  const queue = getQueue().map(item =>
    item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
  );
  saveQueue(queue);
}

// ============================================================================
// SYNC FUNCTIONS - Process queue items to Supabase (one by one)
// ============================================================================

async function syncWorkoutLog(payload: WorkoutLogPayload): Promise<void> {
  // --- Safe Append: detect if coach modified the workout while athlete was offline ---
  let conflictDetected = false;

  if (payload.device_sync_version != null) {
    const { data: serverWorkout } = await supabase
      .from('workouts')
      .select('sync_version')
      .eq('id', payload.workout_id)
      .maybeSingle();

    if (serverWorkout && (serverWorkout as any).sync_version > payload.device_sync_version) {
      // Coach edited while athlete was offline — flag the log but STILL save athlete data
      conflictDetected = true;
      console.warn(
        `[OfflineSync] Conflict: device v${payload.device_sync_version} < server v${(serverWorkout as any).sync_version}. Athlete data saved; coach edits preserved.`
      );
    }
  }

  // Always INSERT into workout_logs (never upsert workouts — preserves coach planning)
  const { data: workoutLog, error: logError } = await supabase
    .from('workout_logs')
    .insert({
      workout_id: payload.workout_id,
      athlete_id: payload.athlete_id,
      started_at: payload.started_at,
      completed_at: payload.completed_at,
      srpe: payload.srpe,
      duration_minutes: payload.duration_minutes,
      notes: conflictDetected
        ? `[SYNC CONFLICT] ${payload.notes || ''} — Versione coach aggiornata durante sessione offline.`
        : payload.notes,
      local_id: payload.local_id,
      sync_status: 'synced',
      exercises_data: payload.exercises as unknown as Json,
    })
    .select('id')
    .single();

  if (logError) throw logError;

  // Insert exercise details
  if (payload.exercises.length > 0) {
    const exercisesData = payload.exercises.map((ex, index) => ({
      workout_log_id: workoutLog.id,
      exercise_name: ex.exercise_name,
      exercise_order: ex.exercise_order ?? index,
      sets_data: ex.sets_data as unknown as Json,
      notes: ex.notes ?? null,
    }));

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exercisesData);

    if (exercisesError) throw exercisesError;
  }

  // Mark the workout as completed (status only — does NOT touch structure/title/description)
  await supabase
    .from('workouts')
    .update({ status: 'completed' as any })
    .eq('id', payload.workout_id);
}

async function syncDailyReadiness(payload: DailyReadinessPayload): Promise<void> {
  const { error } = await supabase
    .from('daily_readiness')
    .upsert({
      athlete_id: payload.athlete_id,
      date: payload.date,
      sleep_hours: payload.sleep_hours,
      sleep_quality: payload.sleep_quality,
      energy: payload.energy,
      mood: payload.mood,
      stress_level: payload.stress_level,
      soreness_map: payload.soreness_map,
      notes: payload.notes,
    }, {
      onConflict: 'athlete_id,date',
    });

  if (error) throw error;
}

async function syncQueueItem(item: QueueItem): Promise<boolean> {
  try {
    if (item.payload.type === 'workout_log') {
      await syncWorkoutLog(item.payload);
    } else if (item.payload.type === 'daily_readiness') {
      await syncDailyReadiness(item.payload);
    }
    return true;
  } catch (error) {
    console.error(`[OfflineSync] Failed to sync ${item.id}:`, error);
    return false;
  }
}

// ============================================================================
// HOOK - Athlete-only offline sync for workout execution
// ============================================================================

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const syncingRef = useRef(false);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Process queue one-by-one, only remove on success
  const processQueue = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;

    syncingRef.current = true;
    const queue = getQueue();

    if (queue.length === 0) {
      syncingRef.current = false;
      return;
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const item of queue) {
      const success = await syncQueueItem(item);

      if (success) {
        removeFromQueue(item.id);
        syncedCount++;
      } else {
        if (item.retryCount < MAX_RETRIES) {
          incrementRetry(item.id);
          toast({
            title: "Sync fallita",
            description: "Nuovo tentativo al prossimo online.",
            variant: "destructive",
          });
        } else {
          removeFromQueue(item.id);
          failedCount++;
        }
      }
    }

    if (syncedCount > 0) {
      toast({
        title: "Workout offline sincronizzati",
        description: `${syncedCount} ${syncedCount === 1 ? 'workout salvato' : 'workout salvati'} con successo.`,
      });
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-readiness'] });
    }

    if (failedCount > 0) {
      toast({
        title: "Sincronizzazione fallita",
        description: `${failedCount} ${failedCount === 1 ? 'elemento perso' : 'elementi persi'} dopo 3 tentativi.`,
        variant: "destructive",
      });
    }

    syncingRef.current = false;
  }, [queryClient, toast]);

  // Listen for online event to trigger sync
  useEffect(() => {
    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener('online', handleOnline);

    // Initial sync if online and queue has pending items
    if (navigator.onLine && getQueue().length > 0) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processQueue]);

  // Mutation: Log workout (queues if offline)
  const logWorkoutMutation = useMutation({
    mutationFn: async (payload: Omit<WorkoutLogPayload, 'type'>) => {
      const fullPayload: WorkoutLogPayload = { ...payload, type: 'workout_log' };

      if (navigator.onLine) {
        await syncWorkoutLog(fullPayload);
        return { synced: true, id: payload.local_id };
      } else {
        addToQueue(fullPayload);
        return { synced: false, id: payload.local_id };
      }
    },
    onSuccess: (result) => {
      toast({
        title: result.synced ? "Workout salvato" : "Workout salvato offline",
        description: result.synced
          ? "Dati sincronizzati."
          : "Verrà sincronizzato quando torni online.",
      });
      if (result.synced) {
        queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare il workout.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Log daily readiness (queues if offline)
  const logReadinessMutation = useMutation({
    mutationFn: async (payload: Omit<DailyReadinessPayload, 'type'>) => {
      const fullPayload: DailyReadinessPayload = { ...payload, type: 'daily_readiness' };

      if (navigator.onLine) {
        await syncDailyReadiness(fullPayload);
        return { synced: true, id: payload.local_id };
      } else {
        addToQueue(fullPayload);
        return { synced: false, id: payload.local_id };
      }
    },
    onSuccess: (result) => {
      toast({
        title: result.synced ? "Check-in salvato" : "Check-in salvato offline",
        description: result.synced
          ? "Dati sincronizzati."
          : "Verrà sincronizzato quando torni online.",
      });
      if (result.synced) {
        queryClient.invalidateQueries({ queryKey: ['daily-readiness'] });
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare il check-in.",
        variant: "destructive",
      });
    },
  });

  return {
    // Status
    isOnline,
    pendingCount: getQueue().length,
    
    // Workout logging (athlete only)
    logWorkout: logWorkoutMutation.mutate,
    logWorkoutAsync: logWorkoutMutation.mutateAsync,
    isLoggingWorkout: logWorkoutMutation.isPending,
    
    // Readiness logging (athlete only)
    logReadiness: logReadinessMutation.mutate,
    logReadinessAsync: logReadinessMutation.mutateAsync,
    isLoggingReadiness: logReadinessMutation.isPending,
    
    // Manual sync trigger
    forceSync: processQueue,
  };
}
