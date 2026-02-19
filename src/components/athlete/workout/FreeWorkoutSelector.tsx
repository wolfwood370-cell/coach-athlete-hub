import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Dumbbell,
  Play,
  X,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectedExercise {
  id: string;
  name: string;
  muscles: string[];
  movement_pattern: string | null;
  exercise_type: string;
}

interface FreeWorkoutSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string | null;
  brandColor?: string | null;
  onConfirm: (exercises: SelectedExercise[]) => void;
}

export function FreeWorkoutSelector({
  open,
  onOpenChange,
  coachId,
  brandColor,
  onConfirm,
}: FreeWorkoutSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["coach-exercises-library", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, muscles, movement_pattern, exercise_type")
        .eq("coach_id", coachId)
        .eq("archived", false)
        .order("name");
      if (error) throw error;
      return (data || []) as SelectedExercise[];
    },
    enabled: !!coachId && open,
  });

  const allMuscles = useMemo(() => {
    const muscleSet = new Set<string>();
    exercises.forEach((ex) => ex.muscles.forEach((m) => muscleSet.add(m)));
    return Array.from(muscleSet).sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        searchQuery === "" ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle =
        !filterMuscle || ex.muscles.includes(filterMuscle);
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, filterMuscle]);

  const toggleExercise = (exercise: SelectedExercise) => {
    setSelectedExercises((prev) => {
      const isSelected = prev.some((e) => e.id === exercise.id);
      return isSelected
        ? prev.filter((e) => e.id !== exercise.id)
        : [...prev, exercise];
    });
  };

  const isSelected = (id: string) => selectedExercises.some((e) => e.id === id);

  const handleConfirm = () => {
    onConfirm(selectedExercises);
    setSelectedExercises([]);
    setSearchQuery("");
    setFilterMuscle(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedExercises([]);
    setSearchQuery("");
    setFilterMuscle(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" style={{ color: brandColor || undefined }} />
            Scegli Esercizi
          </DialogTitle>
          <DialogDescription>
            Seleziona gli esercizi dalla libreria del coach per il tuo allenamento libero
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 pb-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca esercizio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {allMuscles.length > 0 && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 pb-1">
                <Badge
                  variant={filterMuscle === null ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  onClick={() => setFilterMuscle(null)}
                  style={filterMuscle === null && brandColor ? { backgroundColor: brandColor } : undefined}
                >
                  Tutti
                </Badge>
                {allMuscles.slice(0, 8).map((muscle) => (
                  <Badge
                    key={muscle}
                    variant={filterMuscle === muscle ? "default" : "outline"}
                    className="cursor-pointer shrink-0 capitalize"
                    onClick={() => setFilterMuscle(filterMuscle === muscle ? null : muscle)}
                    style={filterMuscle === muscle && brandColor ? { backgroundColor: brandColor } : undefined}
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Selected count */}
        {selectedExercises.length > 0 && (
          <div className="px-4 pb-2">
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ backgroundColor: brandColor ? `${brandColor}15` : "hsl(var(--primary) / 0.1)" }}
            >
              <span className="text-sm font-medium">
                {selectedExercises.length} eserciz{selectedExercises.length === 1 ? "io" : "i"} selezionat{selectedExercises.length === 1 ? "o" : "i"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedExercises([])}
                className="text-xs h-7"
              >
                Rimuovi tutti
              </Button>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 pb-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun esercizio trovato</p>
              </div>
            ) : (
              filteredExercises.map((exercise) => {
                const selected = isSelected(exercise.id);
                return (
                  <div
                    key={exercise.id}
                    onClick={() => toggleExercise(exercise)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                      selected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                    style={
                      selected && brandColor
                        ? { backgroundColor: `${brandColor}15`, borderColor: `${brandColor}50` }
                        : undefined
                    }
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleExercise(exercise)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{exercise.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {exercise.muscles.slice(0, 2).map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-[10px] py-0 capitalize">
                            {muscle}
                          </Badge>
                        ))}
                        {exercise.muscles.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{exercise.muscles.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-4 py-3 border-t bg-muted/30">
          <Button
            onClick={handleConfirm}
            disabled={selectedExercises.length === 0}
            className="w-full gap-2"
            style={{ backgroundColor: brandColor || undefined }}
          >
            <Play className="h-4 w-4" />
            Conferma Selezione ({selectedExercises.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
