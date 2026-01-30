import { useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

// Types for offline workout logging
export interface SetData {
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe?: number;
  completed: boolean;
  [key: string]: Json | undefined;
}

export interface WorkoutExercise {
  id?: string;
  exercise_name: string;
  exercise_order: number;
  sets_data: SetData[];
  notes?: string;
}

export interface WorkoutLogInput {
  local_id: string;
  workout_id: string;
  athlete_id: string;
  started_at: string;
  completed_at?: string;
  srpe?: number;
  duration_minutes?: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

interface PendingWorkout {
  id: string;
  data: WorkoutLogInput;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'pending_workout_logs';
const MAX_RETRIES = 3;

// localStorage helpers
function getPendingWorkouts(): PendingWorkout[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePendingWorkouts(workouts: PendingWorkout[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  } catch (e) {
    console.error('Failed to save pending workouts:', e);
  }
}

function addPendingWorkout(workout: WorkoutLogInput): void {
  const pending = getPendingWorkouts();
  pending.push({
    id: workout.local_id,
    data: workout,
    timestamp: Date.now(),
    retryCount: 0,
  });
  savePendingWorkouts(pending);
}

function removePendingWorkout(id: string): void {
  const pending = getPendingWorkouts().filter(w => w.id !== id);
  savePendingWorkouts(pending);
}

function incrementRetry(id: string): void {
  const pending = getPendingWorkouts().map(w => 
    w.id === id ? { ...w, retryCount: w.retryCount + 1 } : w
  );
  savePendingWorkouts(pending);
}

// Sync a single workout to Supabase
async function syncWorkoutToSupabase(log: WorkoutLogInput): Promise<string> {
  const { data: workoutLog, error: logError } = await supabase
    .from('workout_logs')
    .insert({
      workout_id: log.workout_id,
      athlete_id: log.athlete_id,
      started_at: log.started_at,
      completed_at: log.completed_at,
      srpe: log.srpe,
      duration_minutes: log.duration_minutes,
      notes: log.notes,
      local_id: log.local_id,
      sync_status: 'synced',
      exercises_data: log.exercises as unknown as Json,
    })
    .select('id')
    .single();

  if (logError) throw logError;

  if (log.exercises.length > 0) {
    const exercisesData = log.exercises.map((ex, index) => ({
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

  return workoutLog.id;
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const syncingRef = useRef(false);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Process all pending workouts
  const syncPendingWorkouts = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    
    syncingRef.current = true;
    const pending = getPendingWorkouts();
    
    if (pending.length === 0) {
      syncingRef.current = false;
      return;
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const workout of pending) {
      try {
        await syncWorkoutToSupabase(workout.data);
        removePendingWorkout(workout.id);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync workout ${workout.id}:`, error);
        
        if (workout.retryCount < MAX_RETRIES) {
          incrementRetry(workout.id);
        } else {
          removePendingWorkout(workout.id);
          failedCount++;
        }
      }
    }

    if (syncedCount > 0) {
      toast({
        title: "Workout sincronizzati",
        description: `${syncedCount} workout salvati con successo.`,
      });
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
    }

    if (failedCount > 0) {
      toast({
        title: "Sincronizzazione parziale",
        description: `${failedCount} workout non sincronizzati dopo 3 tentativi.`,
        variant: "destructive",
      });
    }

    syncingRef.current = false;
  }, [queryClient, toast]);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      syncPendingWorkouts();
    };

    window.addEventListener('online', handleOnline);

    // Initial sync on mount if online
    if (navigator.onLine) {
      syncPendingWorkouts();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncPendingWorkouts]);

  // Mutation for logging workouts (works online and offline)
  const logWorkoutMutation = useMutation({
    mutationFn: async (input: WorkoutLogInput) => {
      if (navigator.onLine) {
        return syncWorkoutToSupabase(input);
      } else {
        addPendingWorkout(input);
        return input.local_id;
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['workout-logs'] });
      const previousLogs = queryClient.getQueryData(['workout-logs']);

      queryClient.setQueryData(['workout-logs'], (old: unknown[] | undefined) => {
        const optimisticLog = {
          id: input.local_id,
          ...input,
          sync_status: navigator.onLine ? 'synced' : 'pending',
          created_at: new Date().toISOString(),
        };
        return old ? [...old, optimisticLog] : [optimisticLog];
      });

      return { previousLogs };
    },
    onError: (_, __, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(['workout-logs'], context.previousLogs);
      }
      toast({
        title: "Errore",
        description: "Impossibile salvare il workout.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: navigator.onLine ? "Workout salvato" : "Workout salvato offline",
        description: navigator.onLine 
          ? "Dati sincronizzati."
          : "Verrà sincronizzato quando torni online.",
      });
    },
  });

  const pendingSyncCount = getPendingWorkouts().length;

  return {
    logWorkout: logWorkoutMutation.mutate,
    logWorkoutAsync: logWorkoutMutation.mutateAsync,
    isLogging: logWorkoutMutation.isPending,
    isOnline,
    pendingSyncCount,
    forceSync: syncPendingWorkouts,
  };
}

// Hook for workout exercises
export function useWorkoutExercises(workoutLogId: string | null) {
  return useQuery({
    queryKey: ['workout-exercises', workoutLogId],
    queryFn: async () => {
      if (!workoutLogId) return [];
      
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_log_id', workoutLogId)
        .order('exercise_order');

      if (error) throw error;
      return data;
    },
    enabled: !!workoutLogId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for daily metrics
export function useDailyMetrics(userId: string | null, dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['daily-metrics', userId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('date', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        query = query.lte('date', dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
