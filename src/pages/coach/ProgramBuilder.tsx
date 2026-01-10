import { useState, useCallback } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GripVertical, 
  Dumbbell, 
  Save,
  RotateCcw,
  Search,
  Copy,
  Trash2,
  User,
  Loader2,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Days of week
const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const WEEKS = 4;

// Exercise library with categories
const exerciseLibrary = [
  { id: "squat", name: "Squat", category: "Gambe", defaultPercent: 85 },
  { id: "bench", name: "Panca Piana", category: "Petto", defaultPercent: 75 },
  { id: "deadlift", name: "Stacco", category: "Schiena", defaultPercent: 90 },
  { id: "ohp", name: "Military Press", category: "Spalle", defaultPercent: 55 },
  { id: "row", name: "Rematore", category: "Schiena", defaultPercent: 65 },
  { id: "rdl", name: "Stacco Rumeno", category: "Gambe", defaultPercent: 70 },
  { id: "pullups", name: "Trazioni", category: "Schiena", defaultPercent: 0 },
  { id: "dips", name: "Dips", category: "Petto", defaultPercent: 0 },
  { id: "legpress", name: "Leg Press", category: "Gambe", defaultPercent: 120 },
  { id: "latpull", name: "Lat Machine", category: "Schiena", defaultPercent: 50 },
  { id: "curls", name: "Curl Bicipiti", category: "Braccia", defaultPercent: 25 },
  { id: "triceps", name: "Tricipiti", category: "Braccia", defaultPercent: 20 },
  { id: "lunges", name: "Affondi", category: "Gambe", defaultPercent: 40 },
  { id: "flyes", name: "Croci ai Cavi", category: "Petto", defaultPercent: 15 },
];

// Exercise structure for the program
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  load: string;
  rpe: number | null;
  notes: string;
}

// Program structure: { weekIndex: { dayIndex: Exercise[] } }
type ProgramData = Record<number, Record<number, Exercise[]>>;

// ExerciseCard component
function ExerciseCard({
  exercise,
  oneRM,
  onUpdate,
  onRemove,
}: {
  exercise: Exercise;
  oneRM: number;
  onUpdate: (updated: Exercise) => void;
  onRemove: () => void;
}) {
  // Calculate kg from percentage
  const getCalculatedKg = (loadStr: string): string | null => {
    const match = loadStr.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (match && oneRM > 0) {
      const percent = parseFloat(match[1]);
      const kg = Math.round(oneRM * (percent / 100));
      return `≈ ${kg}kg`;
    }
    return null;
  };

  const calculatedHint = getCalculatedKg(exercise.load);

  return (
    <div className="bg-background rounded-lg border border-border/50 p-2 space-y-2 group hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium truncate flex-1">{exercise.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Input Row */}
      <div className="flex items-center gap-1">
        <div className="flex-shrink-0">
          <Input
            type="number"
            min={1}
            value={exercise.sets || ""}
            onChange={(e) => onUpdate({ ...exercise, sets: parseInt(e.target.value) || 0 })}
            className="h-6 w-10 text-[10px] text-center px-1"
            placeholder="Set"
          />
        </div>
        <span className="text-[10px] text-muted-foreground">×</span>
        <div className="flex-shrink-0">
          <Input
            type="text"
            value={exercise.reps}
            onChange={(e) => onUpdate({ ...exercise, reps: e.target.value })}
            className="h-6 w-14 text-[10px] text-center px-1"
            placeholder="Rep"
          />
        </div>
        <span className="text-[10px] text-muted-foreground">@</span>
        <div className="relative flex-1">
          <Input
            type="text"
            value={exercise.load}
            onChange={(e) => onUpdate({ ...exercise, load: e.target.value })}
            className="h-6 text-[10px] px-1.5 pr-6"
            placeholder="80% o 60kg"
          />
          {calculatedHint && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[8px] text-primary">
              <Calculator className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
      </div>
      
      {/* Smart Load Hint */}
      {calculatedHint && (
        <p className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Calculator className="h-2.5 w-2.5" />
          Calcolo: <span className="text-primary font-medium">{calculatedHint}</span>
        </p>
      )}
      
      {/* RPE & Notes */}
      <div className="flex items-center gap-1">
        <Select
          value={exercise.rpe?.toString() || ""}
          onValueChange={(val) => onUpdate({ ...exercise, rpe: val ? parseInt(val) : null })}
        >
          <SelectTrigger className="h-6 w-16 text-[10px]">
            <SelectValue placeholder="RPE" />
          </SelectTrigger>
          <SelectContent>
            {[6, 7, 8, 9, 10].map((rpe) => (
              <SelectItem key={rpe} value={rpe.toString()} className="text-xs">
                RPE {rpe}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={exercise.notes}
          onChange={(e) => onUpdate({ ...exercise, notes: e.target.value })}
          className="h-6 text-[10px] px-1.5 flex-1"
          placeholder="Note..."
        />
      </div>
    </div>
  );
}

const ProgramBuilder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedExercise, setDraggedExercise] = useState<typeof exerciseLibrary[0] | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [programName, setProgramName] = useState("");
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  
  // Initialize program data
  const [program, setProgram] = useState<ProgramData>(() => {
    const initial: ProgramData = {};
    for (let w = 0; w < WEEKS; w++) {
      initial[w] = {};
      for (let d = 0; d < 7; d++) {
        initial[w][d] = [];
      }
    }
    return initial;
  });

  // Fetch athletes (connected to this coach)
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
  
  // Get 1RM for squat (default exercise for calculations)
  const getOneRM = (): number => {
    if (!selectedAthlete?.one_rm_data) return 100; // Default fallback
    const oneRmData = selectedAthlete.one_rm_data as Record<string, number>;
    return oneRmData.squat || oneRmData.bench || 100;
  };

  const filteredExercises = exerciseLibrary.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update exercise in program
  const updateExercise = useCallback(
    (week: number, day: number, exerciseId: string, updated: Exercise) => {
      setProgram((prev) => ({
        ...prev,
        [week]: {
          ...prev[week],
          [day]: prev[week][day].map((ex) => (ex.id === exerciseId ? updated : ex)),
        },
      }));
    },
    []
  );

  // Remove exercise from program
  const removeExercise = useCallback((week: number, day: number, exerciseId: string) => {
    setProgram((prev) => ({
      ...prev,
      [week]: {
        ...prev[week],
        [day]: prev[week][day].filter((ex) => ex.id !== exerciseId),
      },
    }));
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (week: number, day: number, exercise: typeof exerciseLibrary[0]) => {
      const newExercise: Exercise = {
        id: `${Date.now()}-${Math.random()}`,
        name: exercise.name,
        sets: 3,
        reps: "8",
        load: exercise.defaultPercent > 0 ? `${exercise.defaultPercent}%` : "",
        rpe: null,
        notes: "",
      };

      setProgram((prev) => ({
        ...prev,
        [week]: {
          ...prev[week],
          [day]: [...prev[week][day], newExercise],
        },
      }));
      setDraggedExercise(null);
    },
    []
  );

  // Copy week
  const copyWeek = useCallback((weekIndex: number) => {
    if (weekIndex < WEEKS - 1) {
      setProgram((prev) => ({
        ...prev,
        [weekIndex + 1]: Object.fromEntries(
          Object.entries(prev[weekIndex]).map(([day, exercises]) => [
            day,
            exercises.map((ex) => ({ ...ex, id: `${Date.now()}-${Math.random()}` })),
          ])
        ),
      }));
      toast.success(`Settimana ${weekIndex + 1} copiata nella settimana ${weekIndex + 2}`);
    }
  }, []);

  // Clear week
  const clearWeek = useCallback((weekIndex: number) => {
    setProgram((prev) => ({
      ...prev,
      [weekIndex]: Object.fromEntries(Array.from({ length: 7 }, (_, d) => [d, []])),
    }));
  }, []);

  // Reset grid
  const resetGrid = useCallback(() => {
    const initial: ProgramData = {};
    for (let w = 0; w < WEEKS; w++) {
      initial[w] = {};
      for (let d = 0; d < 7; d++) {
        initial[w][d] = [];
      }
    }
    setProgram(initial);
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

      // Create workout entries for each athlete and each day with exercises
      const workoutsToInsert: Array<{
        coach_id: string;
        athlete_id: string;
        title: string;
        description: string | null;
        structure: Exercise[];
        status: "pending" | "in_progress" | "completed" | "skipped";
        scheduled_date: string | null;
        estimated_duration: number | null;
      }> = [];

      const today = new Date();
      
      // For each selected athlete, create a copy of all workouts
      for (const athleteId of athleteIds) {
        for (const [weekStr, days] of Object.entries(structure)) {
          const weekIndex = parseInt(weekStr);
          for (const [dayStr, exercises] of Object.entries(days)) {
            const dayIndex = parseInt(dayStr);
            if (exercises.length > 0) {
              // Calculate scheduled date based on week and day
              const scheduledDate = new Date(today);
              scheduledDate.setDate(today.getDate() + weekIndex * 7 + dayIndex);
              
              workoutsToInsert.push({
                coach_id: user.id,
                athlete_id: athleteId,
                title: `${title} - Sett.${weekIndex + 1} ${DAYS[dayIndex]}`,
                description: null,
                structure: exercises as Exercise[],
                status: "pending",
                scheduled_date: scheduledDate.toISOString().split("T")[0],
                estimated_duration: exercises.length * 10, // ~10 min per exercise
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
      toast.success(`Programma salvato! ${result.sessions} sessioni create per ${result.athletes} atleti.`);
      queryClient.invalidateQueries({ queryKey: ["coach-workouts"] });
      setSaveDialogOpen(false);
      setProgramName("");
      setSelectedAthleteIds([]);
      resetGrid();
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

  const totalExercises = Object.values(program).reduce(
    (acc, week) => acc + Object.values(week).reduce((a, day) => a + day.length, 0),
    0
  );

  return (
    <CoachLayout title="Program Builder" subtitle="Crea schede di allenamento">
      <div className="flex gap-4 h-[calc(100vh-160px)]">
        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
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
              <Button variant="outline" size="sm" onClick={resetGrid} className="h-8">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
              <Button
                size="sm"
                className="h-8 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                onClick={() => {
                  // Pre-select the currently selected athlete if any
                  if (selectedAthlete?.id && !selectedAthleteIds.includes(selectedAthlete.id)) {
                    setSelectedAthleteIds([selectedAthlete.id]);
                  }
                  setSaveDialogOpen(true);
                }}
                disabled={totalExercises === 0}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Salva Programma
              </Button>
            </div>
          </div>

          {/* Excel-like Grid */}
          <Card className="flex-1 overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="min-w-[900px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border sticky top-0 z-20 bg-muted/50 backdrop-blur-sm">
                    <div className="p-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-r border-border/50" />
                    {DAYS.map((day) => (
                      <div
                        key={day}
                        className="p-2 text-[10px] uppercase tracking-wider text-center font-medium border-r border-border/50 last:border-r-0"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Week Rows */}
                  {Array.from({ length: WEEKS }).map((_, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/50 last:border-b-0 group/week"
                    >
                      {/* Week Label */}
                      <div className="p-2 bg-muted/30 border-r border-border/50 flex flex-col justify-between">
                        <span className="text-xs font-medium">Sett. {weekIndex + 1}</span>
                        <div className="flex gap-1 opacity-0 group-hover/week:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyWeek(weekIndex)}
                            title="Copia alla settimana successiva"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => clearWeek(weekIndex)}
                            title="Svuota settimana"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Day Cells */}
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const exercises = program[weekIndex]?.[dayIndex] || [];

                        return (
                          <div
                            key={dayIndex}
                            className={cn(
                              "min-h-[140px] border-r border-border/50 last:border-r-0 p-1.5 transition-colors",
                              "hover:bg-muted/20",
                              draggedExercise && "hover:bg-primary/10"
                            )}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add("bg-primary/20");
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove("bg-primary/20");
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove("bg-primary/20");
                              if (draggedExercise) {
                                handleDrop(weekIndex, dayIndex, draggedExercise);
                              }
                            }}
                          >
                            <div className="space-y-1.5">
                              {exercises.map((exercise) => (
                                <ExerciseCard
                                  key={exercise.id}
                                  exercise={exercise}
                                  oneRM={getOneRM()}
                                  onUpdate={(updated) =>
                                    updateExercise(weekIndex, dayIndex, exercise.id, updated)
                                  }
                                  onRemove={() => removeExercise(weekIndex, dayIndex, exercise.id)}
                                />
                              ))}
                              {exercises.length === 0 && (
                                <div className="h-full min-h-[100px] flex items-center justify-center text-[10px] text-muted-foreground/50">
                                  Trascina qui
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Help Text */}
          <p className="text-[10px] text-muted-foreground text-center">
            Trascina gli esercizi dalla libreria · Usa <code className="bg-muted px-1 rounded">80%</code> per calcolo automatico dal 1RM · I valori si salvano automaticamente
          </p>
        </div>

        {/* Exercise Library Sidebar */}
        <Card className="w-64 flex-shrink-0 border-0 shadow-sm">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Libreria Esercizi
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-7 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="p-3 pt-0 space-y-1">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    draggable
                    onDragStart={() => setDraggedExercise(exercise)}
                    onDragEnd={() => setDraggedExercise(null)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border border-transparent cursor-grab active:cursor-grabbing",
                      "hover:bg-muted/50 hover:border-border/50 transition-all",
                      draggedExercise?.id === exercise.id && "opacity-50 ring-1 ring-primary"
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{exercise.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          {exercise.category}
                        </Badge>
                        {exercise.defaultPercent > 0 && (
                          <span className="text-[9px] text-muted-foreground tabular-nums">
                            ~{exercise.defaultPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salva Programma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Nome Programma</Label>
              <Input
                id="program-name"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Es: Fase Forza - Marzo 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Assegna ad Atleti ({selectedAthleteIds.length} selezionati)</Label>
              <ScrollArea className="h-40 border rounded-md p-2">
                <div className="space-y-2">
                  {athletes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessun atleta disponibile</p>
                  ) : (
                    athletes.map((athlete) => (
                      <label
                        key={athlete.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedAthleteIds.includes(athlete.id)}
                          onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                        />
                        <span className="text-sm">{athlete.full_name || "Atleta"}</span>
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="text-sm text-muted-foreground">
              Verranno create <span className="font-semibold text-foreground">{
                selectedAthleteIds.length > 0 && totalExercises > 0
                  ? selectedAthleteIds.length * Object.values(program).reduce(
                      (acc, week) => acc + Object.values(week).filter(day => day.length > 0).length,
                      0
                    )
                  : 0
              }</span> sessioni di allenamento per <span className="font-semibold text-foreground">{selectedAthleteIds.length}</span> atleti.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSaveDialogOpen(false)}
              className="text-violet-400 hover:text-violet-300 hover:bg-violet-900/20"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || selectedAthleteIds.length === 0 || !programName.trim()}
              className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
};

export default ProgramBuilder;
