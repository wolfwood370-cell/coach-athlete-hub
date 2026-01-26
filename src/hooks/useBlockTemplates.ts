import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProgramBuilderStore } from "@/stores/useProgramBuilderStore";
import { toast } from "sonner";
import type { ProgramData } from "@/components/coach/WeekGrid";
import type { BlockSaveConfig } from "@/components/coach/SaveBlockDialog";

export function useBlockTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { extractBlock, insertBlock, program, totalWeeks } = useProgramBuilderStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Save a block as a template
  const saveBlockTemplate = useCallback(
    async (config: BlockSaveConfig) => {
      if (!user?.id) {
        toast.error("Utente non autenticato");
        return;
      }

      setIsSaving(true);

      try {
        // 1. Create program_plan with is_template = true
        const { data: plan, error: planError } = await supabase
          .from("program_plans")
          .insert({
            coach_id: user.id,
            name: config.name,
            description: config.description || null,
            is_template: true,
          })
          .select()
          .single();

        if (planError) throw planError;

        // 2. Extract the block data
        const blockData = extractBlock(config.startWeek, config.endWeek);
        const weekCount = config.endWeek - config.startWeek + 1;

        // 3. Create weeks
        for (let w = 0; w < weekCount; w++) {
          const { data: week, error: weekError } = await supabase
            .from("program_weeks")
            .insert({
              program_plan_id: plan.id,
              week_order: w + 1,
              name: `Settimana ${w + 1}`,
            })
            .select()
            .single();

          if (weekError) throw weekError;

          // 4. Create days for each week
          for (let d = 0; d < 7; d++) {
            const exercises = blockData[w]?.[d] || [];
            if (exercises.length === 0) continue;

            const { data: day, error: dayError } = await supabase
              .from("program_days")
              .insert({
                program_week_id: week.id,
                day_number: d + 1,
                name: null,
              })
              .select()
              .single();

            if (dayError) throw dayError;

            // 5. Create a workout for the day
            const { data: workout, error: workoutError } = await supabase
              .from("program_workouts")
              .insert({
                program_day_id: day.id,
                name: `Allenamento`,
                sort_order: 0,
              })
              .select()
              .single();

            if (workoutError) throw workoutError;

            // 6. Create exercises
            const exerciseInserts = exercises
              .filter((ex) => !ex.isEmpty && ex.exerciseId)
              .map((ex, idx) => ({
                program_workout_id: workout.id,
                exercise_id: ex.exerciseId,
                sort_order: idx,
                sets: ex.sets,
                reps: ex.reps,
                load_text: ex.load || null,
                rpe: ex.rpe?.toString() || null,
                rest: ex.restSeconds?.toString() || null,
                notes: ex.notes || null,
                snapshot_muscles: ex.snapshotMuscles || [],
                snapshot_tracking_fields: ex.snapshotTrackingFields || [],
              }));

            if (exerciseInserts.length > 0) {
              const { error: exError } = await supabase
                .from("program_exercises")
                .insert(exerciseInserts);

              if (exError) throw exError;
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ["block-templates"] });
        toast.success(`Template "${config.name}" salvato con successo`);
      } catch (error) {
        console.error("Error saving block template:", error);
        toast.error("Errore nel salvataggio del template");
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, extractBlock, queryClient]
  );

  // Load a template and insert it into the program
  const loadBlockTemplate = useCallback(
    async (templateId: string, insertAtWeek: number) => {
      if (!user?.id) {
        toast.error("Utente non autenticato");
        return;
      }

      setIsLoading(true);

      try {
        // Fetch the complete template structure
        const { data: templateData, error: templateError } = await supabase
          .from("program_plans")
          .select(`
            id,
            name,
            program_weeks (
              id,
              week_order,
              program_days (
                id,
                day_number,
                program_workouts (
                  id,
                  program_exercises (
                    id,
                    exercise_id,
                    sort_order,
                    sets,
                    reps,
                    load_text,
                    rpe,
                    rest,
                    notes,
                    snapshot_muscles,
                    snapshot_tracking_fields,
                    exercises (
                      id,
                      name
                    )
                  )
                )
              )
            )
          `)
          .eq("id", templateId)
          .single();

        if (templateError) throw templateError;

        // Transform to ProgramData format
        const blockData: ProgramData = {};
        const weeks = templateData.program_weeks || [];

        // Sort weeks by order
        const sortedWeeks = [...weeks].sort((a, b) => a.week_order - b.week_order);

        sortedWeeks.forEach((week, weekIdx) => {
          blockData[weekIdx] = {};

          for (let d = 0; d < 7; d++) {
            blockData[weekIdx][d] = [];
          }

          const days = week.program_days || [];
          days.forEach((day) => {
            const dayIndex = day.day_number - 1;
            const workouts = day.program_workouts || [];

            workouts.forEach((workout) => {
              const exercises = workout.program_exercises || [];
              const sortedExercises = [...exercises].sort((a, b) => a.sort_order - b.sort_order);

              sortedExercises.forEach((ex) => {
                const exerciseData = ex.exercises as { id: string; name: string } | null;
                blockData[weekIdx][dayIndex].push({
                  id: crypto.randomUUID(),
                  exerciseId: ex.exercise_id || "",
                  name: exerciseData?.name || "Esercizio",
                  sets: ex.sets || 3,
                  reps: ex.reps || "8-12",
                  load: ex.load_text || "",
                  rpe: ex.rpe ? parseFloat(ex.rpe) : null,
                  restSeconds: ex.rest ? parseInt(ex.rest) : 90,
                  notes: ex.notes || "",
                  isEmpty: false,
                  snapshotMuscles: (ex.snapshot_muscles as string[]) || [],
                  snapshotTrackingFields: (ex.snapshot_tracking_fields as string[]) || [],
                });
              });
            });
          });
        });

        // Insert the block into the program
        insertBlock(blockData, insertAtWeek);

        toast.success(`Template "${templateData.name}" caricato alla settimana ${insertAtWeek + 1}`);
      } catch (error) {
        console.error("Error loading block template:", error);
        toast.error("Errore nel caricamento del template");
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, insertBlock]
  );

  return {
    saveBlockTemplate,
    loadBlockTemplate,
    isSaving,
    isLoading,
  };
}
