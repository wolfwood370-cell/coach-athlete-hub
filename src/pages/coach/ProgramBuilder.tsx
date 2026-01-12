import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { ExerciseLibrarySidebar, exerciseLibrary, type LibraryExercise } from "@/components/coach/ExerciseLibrarySidebar";
import { WeekGrid, type ProgramExercise, type ProgramData, type WeekProgram } from "@/components/coach/WeekGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Save,
  RotateCcw,
  Dumbbell,
  Loader2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TOTAL_WEEKS = 4;
const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Initialize empty program
function createEmptyProgram(): ProgramData {
  const program: ProgramData = {};
  for (let w = 0; w < TOTAL_WEEKS; w++) {
    program[w] = {};
    for (let d = 0; d < 7; d++) {
      program[w][d] = [];
    }
  }
  return program;
}

// Dragging overlay component
function DragOverlayContent({ exercise }: { exercise: LibraryExercise | null }) {
  if (!exercise) return null;
  
  return (
    <div className="bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[180px]">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{exercise.name}</p>
          <p className="text-[10px] text-muted-foreground">{exercise.muscle}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProgramBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [currentWeek, setCurrentWeek] = useState(0);
  const [program, setProgram] = useState<ProgramData>(createEmptyProgram);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [programName, setProgramName] = useState("");
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<LibraryExercise | null>(null);
  const [supersetPendingId, setSupersetPendingId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ["coach-athletes-for-program", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, one_rm_data")
        .eq("coach_id", user.id)
        .eq("role", "athlete");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId) || athletes[0];

  // Get 1RM reference
  const getOneRM = useCallback((): number => {
    if (!selectedAthlete?.one_rm_data) return 100;
    const oneRmData = selectedAthlete.one_rm_data as Record<string, number>;
    return oneRmData.squat || oneRmData.bench || 100;
  }, [selectedAthlete]);

  // Current week data
  const weekData = program[currentWeek] || {};

  // Stats
  const totalExercises = useMemo(() => {
    return Object.values(program).reduce(
      (acc, week) => acc + Object.values(week).reduce((a, day) => a + day.length, 0),
      0
    );
  }, [program]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === "library-exercise") {
      setActiveExercise(active.data.current.exercise);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveExercise(null);

    if (!over) return;

    // Library exercise dropped on day cell
    if (active.data.current?.type === "library-exercise" && over.data.current?.type === "day-cell") {
      const libraryExercise = active.data.current.exercise as LibraryExercise;
      const { weekIndex, dayIndex } = over.data.current;

      const newExercise: ProgramExercise = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        exerciseId: libraryExercise.id,
        name: libraryExercise.name,
        sets: 3,
        reps: "8",
        load: libraryExercise.defaultPercent > 0 ? `${libraryExercise.defaultPercent}%` : "",
        rpe: null,
        restSeconds: 90,
        notes: "",
      };

      setProgram((prev) => ({
        ...prev,
        [weekIndex]: {
          ...prev[weekIndex],
          [dayIndex]: [...(prev[weekIndex]?.[dayIndex] || []), newExercise],
        },
      }));
      return;
    }

    // Reorder within same day
    if (active.data.current?.type === "program-exercise" && over.data.current?.type === "program-exercise") {
      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData.dayIndex === overData.dayIndex && activeData.weekIndex === overData.weekIndex) {
        const { weekIndex, dayIndex } = activeData;
        const exercises = [...(program[weekIndex]?.[dayIndex] || [])];
        const oldIndex = exercises.findIndex((e) => e.id === active.id);
        const newIndex = exercises.findIndex((e) => e.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(exercises, oldIndex, newIndex);
          setProgram((prev) => ({
            ...prev,
            [weekIndex]: {
              ...prev[weekIndex],
              [dayIndex]: reordered,
            },
          }));
        }
      }
    }
  }, [program]);

  // Update exercise
  const handleUpdateExercise = useCallback(
    (dayIndex: number, exerciseId: string, updated: ProgramExercise) => {
      setProgram((prev) => ({
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [dayIndex]: prev[currentWeek][dayIndex].map((ex) =>
            ex.id === exerciseId ? updated : ex
          ),
        },
      }));
    },
    [currentWeek]
  );

  // Remove exercise
  const handleRemoveExercise = useCallback(
    (dayIndex: number, exerciseId: string) => {
      setProgram((prev) => ({
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [dayIndex]: prev[currentWeek][dayIndex].filter((ex) => ex.id !== exerciseId),
        },
      }));
    },
    [currentWeek]
  );

  // Toggle superset
  const handleToggleSuperset = useCallback(
    (dayIndex: number, exerciseId: string) => {
      const exercises = program[currentWeek]?.[dayIndex] || [];
      const exercise = exercises.find((e) => e.id === exerciseId);
      
      if (!exercise) return;

      // If already in superset, remove it
      if (exercise.supersetGroup) {
        setProgram((prev) => ({
          ...prev,
          [currentWeek]: {
            ...prev[currentWeek],
            [dayIndex]: prev[currentWeek][dayIndex].map((ex) =>
              ex.id === exerciseId ? { ...ex, supersetGroup: undefined } : ex
            ),
          },
        }));
        return;
      }

      // If no pending superset, set this as pending
      if (!supersetPendingId) {
        setSupersetPendingId(exerciseId);
        toast.info("Clicca su un altro esercizio per collegarlo in superset");
        return;
      }

      // Link with pending exercise
      const groupId = `superset-${Date.now()}`;
      setProgram((prev) => ({
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [dayIndex]: prev[currentWeek][dayIndex].map((ex) =>
            ex.id === exerciseId || ex.id === supersetPendingId
              ? { ...ex, supersetGroup: groupId }
              : ex
          ),
        },
      }));
      setSupersetPendingId(null);
      toast.success("Superset creato!");
    },
    [currentWeek, program, supersetPendingId]
  );

  // Copy week to next
  const handleCopyWeek = useCallback(() => {
    if (currentWeek >= TOTAL_WEEKS - 1) return;
    
    setProgram((prev) => ({
      ...prev,
      [currentWeek + 1]: Object.fromEntries(
        Object.entries(prev[currentWeek]).map(([day, exercises]) => [
          day,
          exercises.map((ex) => ({
            ...ex,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
        ])
      ),
    }));
    toast.success(`Settimana ${currentWeek + 1} copiata in settimana ${currentWeek + 2}`);
  }, [currentWeek]);

  // Clear week
  const handleClearWeek = useCallback(() => {
    setProgram((prev) => ({
      ...prev,
      [currentWeek]: Object.fromEntries(Array.from({ length: 7 }, (_, d) => [d, []])),
    }));
    toast.success(`Settimana ${currentWeek + 1} svuotata`);
  }, [currentWeek]);

  // Reset entire program
  const handleResetProgram = useCallback(() => {
    setProgram(createEmptyProgram());
    toast.success("Programma resettato");
  }, []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      athleteIds,
      title,
      structure,
    }: {
      athleteIds: string[];
      title: string;
      structure: ProgramData;
    }) => {
      if (!user) throw new Error("Non autenticato");
      if (athleteIds.length === 0) throw new Error("Seleziona almeno un atleta");

      const workoutsToInsert: Array<{
        coach_id: string;
        athlete_id: string;
        title: string;
        description: string | null;
        structure: ProgramExercise[];
        status: "pending" | "in_progress" | "completed" | "skipped";
        scheduled_date: string | null;
        estimated_duration: number | null;
      }> = [];

      const today = new Date();

      for (const athleteId of athleteIds) {
        for (const [weekStr, days] of Object.entries(structure)) {
          const weekIndex = parseInt(weekStr);
          for (const [dayStr, exercises] of Object.entries(days)) {
            const dayIndex = parseInt(dayStr);
            if (exercises.length > 0) {
              const scheduledDate = new Date(today);
              scheduledDate.setDate(today.getDate() + weekIndex * 7 + dayIndex);

              workoutsToInsert.push({
                coach_id: user.id,
                athlete_id: athleteId,
                title: `${title} - S${weekIndex + 1} ${DAYS[dayIndex]}`,
                description: null,
                structure: exercises,
                status: "pending",
                scheduled_date: scheduledDate.toISOString().split("T")[0],
                estimated_duration: exercises.length * 10,
              });
            }
          }
        }
      }

      if (workoutsToInsert.length === 0) {
        throw new Error("Il programma è vuoto. Aggiungi almeno un esercizio.");
      }

      const { error } = await supabase.from("workouts").insert(workoutsToInsert as any);
      if (error) throw error;
      return { sessions: workoutsToInsert.length, athletes: athleteIds.length };
    },
    onSuccess: (result) => {
      toast.success(`Programma salvato! ${result.sessions} sessioni per ${result.athletes} atleti.`);
      queryClient.invalidateQueries({ queryKey: ["coach-workouts"] });
      setSaveDialogOpen(false);
      setProgramName("");
      setSelectedAthleteIds([]);
      handleResetProgram();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (selectedAthleteIds.length === 0) {
      toast.error("Seleziona almeno un atleta");
      return;
    }
    if (!programName.trim()) {
      toast.error("Inserisci un nome per il programma");
      return;
    }
    saveMutation.mutate({
      athleteIds: selectedAthleteIds,
      title: programName.trim(),
      structure: program,
    });
  };

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthleteIds((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  return (
    <CoachLayout title="Program Builder" subtitle="Crea schede di allenamento drag & drop">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-[calc(100vh-140px)]">
          {/* Left Sidebar - Exercise Library */}
          <ExerciseLibrarySidebar className="w-64 flex-shrink-0" />

          {/* Main Content - Week Grid */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card">
              <div className="flex items-center gap-4">
                {/* Athlete Selector */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedAthleteId || selectedAthlete?.id || ""}
                    onValueChange={setSelectedAthleteId}
                  >
                    <SelectTrigger className="w-44 h-8 text-sm">
                      <SelectValue placeholder="Seleziona atleta" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nessun atleta
                        </SelectItem>
                      ) : (
                        athletes.map((athlete) => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.full_name || "Atleta"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 1RM Display */}
                {selectedAthlete && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary">
                    <Label className="text-xs text-muted-foreground">1RM Ref</Label>
                    <span className="text-sm font-semibold tabular-nums">{getOneRM()} kg</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {totalExercises} esercizi
                </Badge>
                <Button variant="outline" size="sm" onClick={handleResetProgram} className="h-8">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="h-8 gradient-primary"
                  onClick={() => {
                    if (selectedAthlete?.id && !selectedAthleteIds.includes(selectedAthlete.id)) {
                      setSelectedAthleteIds([selectedAthlete.id]);
                    }
                    setSaveDialogOpen(true);
                  }}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Salva
                </Button>
              </div>
            </div>

            {/* Week Grid */}
            <WeekGrid
              currentWeek={currentWeek}
              totalWeeks={TOTAL_WEEKS}
              weekData={weekData}
              oneRM={getOneRM()}
              onWeekChange={setCurrentWeek}
              onUpdateExercise={handleUpdateExercise}
              onRemoveExercise={handleRemoveExercise}
              onToggleSuperset={handleToggleSuperset}
              onCopyWeek={handleCopyWeek}
              onClearWeek={handleClearWeek}
            />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          <DragOverlayContent exercise={activeExercise} />
        </DragOverlay>
      </DndContext>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Salva Programma
            </DialogTitle>
            <DialogDescription>
              Assegna il programma agli atleti selezionati
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Nome Programma</Label>
              <Input
                id="program-name"
                placeholder="es. Forza - Mesociclo 1"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Atleti</Label>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                {athletes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessun atleta collegato
                  </p>
                ) : (
                  <div className="space-y-2">
                    {athletes.map((athlete) => (
                      <div
                        key={athlete.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedAthleteIds.includes(athlete.id)
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-secondary"
                        )}
                        onClick={() => toggleAthleteSelection(athlete.id)}
                      >
                        <Checkbox checked={selectedAthleteIds.includes(athlete.id)} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {athlete.full_name || "Atleta"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gradient-primary"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salva Programma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
}
