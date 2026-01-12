import { useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

// Types for offline-first workout logging
export interface SetData {
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe?: number;
  completed: boolean;
  [key: string]: Json | undefined; // Index signature for Json compatibility
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

interface PendingSync {
  id: string;
  data: WorkoutLogInput;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_STORAGE_KEY = 'offline_workout_logs';
const MAX_RETRY_COUNT = 3;

// Utility to check online status
const getOnlineStatus = () => 
  typeof navigator !== 'undefined' ? navigator.onLine : true;

// Local storage helpers for persistence
const getStoredPendingLogs = (): PendingSync[] => {
  try {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setStoredPendingLogs = (logs: PendingSync[]) => {
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to persist offline logs:', e);
  }
};

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const syncingRef = useRef(false);
  const onlineRef = useRef(getOnlineStatus());

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      onlineRef.current = true;
      toast({
        title: "Connessione ripristinata",
        description: "Sincronizzazione dati in corso...",
      });
      syncPendingLogs();
    };

    const handleOffline = () => {
      onlineRef.current = false;
      toast({
        title: "Modalità offline",
        description: "I dati verranno sincronizzati quando torni online.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check on mount
    if (onlineRef.current) {
      syncPendingLogs();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Sync a single workout log to Supabase
  const syncWorkoutLog = async (log: WorkoutLogInput): Promise<string> => {
    // First, insert the workout log
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

    // Then insert normalized exercises
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
  };

  // Process all pending logs
  const syncPendingLogs = useCallback(async () => {
    if (syncingRef.current || !onlineRef.current) return;
    
    syncingRef.current = true;
    const pendingLogs = getStoredPendingLogs();
    
    if (pendingLogs.length === 0) {
      syncingRef.current = false;
      return;
    }

    const remainingLogs: PendingSync[] = [];
    let syncedCount = 0;

    for (const pending of pendingLogs) {
      try {
        await syncWorkoutLog(pending.data);
        syncedCount++;
      } catch (error) {
        console.error('Failed to sync workout log:', error);
        
        if (pending.retryCount < MAX_RETRY_COUNT) {
          remainingLogs.push({
            ...pending,
            retryCount: pending.retryCount + 1,
          });
        } else {
          // Mark as failed after max retries
          toast({
            title: "Sincronizzazione fallita",
            description: `Workout del ${new Date(pending.timestamp).toLocaleDateString()} non sincronizzato.`,
            variant: "destructive",
          });
        }
      }
    }

    setStoredPendingLogs(remainingLogs);
    
    if (syncedCount > 0) {
      toast({
        title: "Sincronizzazione completata",
        description: `${syncedCount} workout sincronizzati.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      queryClient.invalidateQueries({ queryKey: ['workout-exercises'] });
    }

    syncingRef.current = false;
  }, [queryClient, toast]);

  // Optimistic mutation for logging workouts
  const logWorkoutMutation = useMutation({
    mutationFn: async (input: WorkoutLogInput) => {
      if (onlineRef.current) {
        // Online: sync directly
        return syncWorkoutLog(input);
      } else {
        // Offline: store locally
        const pendingLogs = getStoredPendingLogs();
        pendingLogs.push({
          id: input.local_id,
          data: input,
          timestamp: Date.now(),
          retryCount: 0,
        });
        setStoredPendingLogs(pendingLogs);
        return input.local_id;
      }
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workout-logs'] });

      // Snapshot previous value
      const previousLogs = queryClient.getQueryData(['workout-logs']);

      // Optimistically update cache
      queryClient.setQueryData(['workout-logs'], (old: any[] | undefined) => {
        const optimisticLog = {
          id: input.local_id,
          ...input,
          sync_status: onlineRef.current ? 'synced' : 'pending',
          created_at: new Date().toISOString(),
        };
        return old ? [...old, optimisticLog] : [optimisticLog];
      });

      return { previousLogs };
    },
    onError: (err, input, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(['workout-logs'], context.previousLogs);
      }
      toast({
        title: "Errore",
        description: "Impossibile salvare il workout. Riprova.",
        variant: "destructive",
      });
    },
    onSuccess: (_, input) => {
      toast({
        title: onlineRef.current ? "Workout salvato" : "Workout salvato offline",
        description: onlineRef.current 
          ? "Dati sincronizzati con successo."
          : "Verrà sincronizzato quando torni online.",
      });
    },
  });

  // Query for pending sync count
  const pendingSyncCount = getStoredPendingLogs().length;

  // Force sync (manual trigger)
  const forceSync = useCallback(() => {
    if (onlineRef.current) {
      syncPendingLogs();
    } else {
      toast({
        title: "Offline",
        description: "Impossibile sincronizzare senza connessione.",
        variant: "destructive",
      });
    }
  }, [syncPendingLogs, toast]);

  return {
    logWorkout: logWorkoutMutation.mutate,
    logWorkoutAsync: logWorkoutMutation.mutateAsync,
    isLogging: logWorkoutMutation.isPending,
    isOnline: onlineRef.current,
    pendingSyncCount,
    forceSync,
    syncPendingLogs,
  };
}

// Hook for workout exercises with offline support
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for daily metrics with offline support
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
