import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, parseISO, isWithinInterval, areIntervalsOverlapping } from "date-fns";

export type PhaseFocusType = 
  | "strength" 
  | "hypertrophy" 
  | "endurance" 
  | "power" 
  | "recovery" 
  | "peaking" 
  | "transition";

export interface TrainingPhase {
  id: string;
  coach_id: string;
  athlete_id: string;
  name: string;
  start_date: string;
  end_date: string;
  focus_type: PhaseFocusType;
  base_volume: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePhaseInput {
  athlete_id: string;
  name: string;
  start_date: string;
  end_date: string;
  focus_type: PhaseFocusType;
  base_volume?: number;
  notes?: string;
}

export interface UpdatePhaseInput extends Partial<CreatePhaseInput> {
  id: string;
}

interface OverlapCheckResult {
  hasOverlap: boolean;
  conflictingPhases: TrainingPhase[];
}

export function usePeriodization(athleteId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch phases for the selected athlete
  const { data: phases, isLoading, error } = useQuery({
    queryKey: ["training-phases", athleteId],
    queryFn: async (): Promise<TrainingPhase[]> => {
      if (!athleteId) return [];

      const { data, error } = await supabase
        .from("training_phases")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching training phases:", error);
        throw error;
      }

      return (data || []) as TrainingPhase[];
    },
    enabled: !!athleteId && !!user?.id,
  });

  // Check for date overlap with existing phases
  const checkOverlap = (
    newPhase: { start_date: string; end_date: string; id?: string },
    existingPhases: TrainingPhase[] = phases || []
  ): OverlapCheckResult => {
    const newInterval = {
      start: parseISO(newPhase.start_date),
      end: parseISO(newPhase.end_date),
    };

    const conflictingPhases = existingPhases.filter((phase) => {
      // Skip the phase being edited
      if (newPhase.id && phase.id === newPhase.id) return false;

      const existingInterval = {
        start: parseISO(phase.start_date),
        end: parseISO(phase.end_date),
      };

      return areIntervalsOverlapping(newInterval, existingInterval, { inclusive: true });
    });

    return {
      hasOverlap: conflictingPhases.length > 0,
      conflictingPhases,
    };
  };

  // Create phase mutation
  const createPhaseMutation = useMutation({
    mutationFn: async (input: CreatePhaseInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check for overlap before saving
      const overlapResult = checkOverlap({
        start_date: input.start_date,
        end_date: input.end_date,
      });

      if (overlapResult.hasOverlap) {
        const conflictNames = overlapResult.conflictingPhases
          .map((p) => p.name)
          .join(", ");
        throw new Error(`Date in conflitto con: ${conflictNames}`);
      }

      const { data, error } = await supabase
        .from("training_phases")
        .insert({
          coach_id: user.id,
          athlete_id: input.athlete_id,
          name: input.name,
          start_date: input.start_date,
          end_date: input.end_date,
          focus_type: input.focus_type,
          base_volume: input.base_volume || 100,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating phase:", error);
        throw error;
      }

      return data as TrainingPhase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-phases", athleteId] });
      toast.success("Fase creata con successo");
    },
    onError: (error) => {
      console.error("Create phase error:", error);
      toast.error(error.message || "Errore nella creazione della fase");
    },
  });

  // Update phase mutation
  const updatePhaseMutation = useMutation({
    mutationFn: async (input: UpdatePhaseInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check for overlap if dates are being updated
      if (input.start_date && input.end_date) {
        const overlapResult = checkOverlap({
          id: input.id,
          start_date: input.start_date,
          end_date: input.end_date,
        });

        if (overlapResult.hasOverlap) {
          const conflictNames = overlapResult.conflictingPhases
            .map((p) => p.name)
            .join(", ");
          throw new Error(`Date in conflitto con: ${conflictNames}`);
        }
      }

      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("training_phases")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating phase:", error);
        throw error;
      }

      return data as TrainingPhase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-phases", athleteId] });
      toast.success("Fase aggiornata");
    },
    onError: (error) => {
      console.error("Update phase error:", error);
      toast.error(error.message || "Errore nell'aggiornamento della fase");
    },
  });

  // Delete phase mutation
  const deletePhaseMutation = useMutation({
    mutationFn: async (phaseId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("training_phases")
        .delete()
        .eq("id", phaseId);

      if (error) {
        console.error("Error deleting phase:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-phases", athleteId] });
      toast.success("Fase eliminata");
    },
    onError: (error) => {
      console.error("Delete phase error:", error);
      toast.error("Errore nell'eliminazione della fase");
    },
  });

  return {
    phases: phases || [],
    isLoading,
    error,
    checkOverlap,
    createPhase: createPhaseMutation.mutateAsync,
    updatePhase: updatePhaseMutation.mutateAsync,
    deletePhase: deletePhaseMutation.mutateAsync,
    isCreating: createPhaseMutation.isPending,
    isUpdating: updatePhaseMutation.isPending,
    isDeleting: deletePhaseMutation.isPending,
  };
}
