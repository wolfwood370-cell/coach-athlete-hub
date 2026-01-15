import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MultiSelect, GroupedOptions } from "@/components/ui/multi-select";
import {
  Search,
  Plus,
  Dumbbell,
  Video,
  Pencil,
  Trash2,
  Loader2,
  Filter,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  MUSCLE_TAGS,
  MOVEMENT_PATTERNS,
  EXERCISE_TYPES,
  getMusclesGrouped,
} from "@/lib/muscleTags";
import { TrackingMetricBuilder } from "@/components/coach/TrackingMetricBuilder";

// Types
interface Exercise {
  id: string;
  name: string;
  video_url: string | null;
  muscles: string[];
  secondary_muscles: string[];
  tracking_fields: string[];
  movement_pattern: string | null;
  exercise_type: string;
  notes: string | null;
  coach_id: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

// Sample exercises for initial data
const SAMPLE_EXERCISES: Omit<Exercise, "id" | "coach_id" | "created_at" | "updated_at">[] = [
  {
    name: "Panca Inclinata con Manubri",
    video_url: null,
    muscles: ["Pettorali (c. clavicolari)"],
    secondary_muscles: ["Deltoidi (anteriori)", "Tricipiti (capo lungo)"],
    tracking_fields: ["sets", "reps", "weight", "rpe"],
    movement_pattern: "spinta_orizzontale",
    exercise_type: "Multi-articolare",
    notes: null,
    archived: false,
  },
  {
    name: "Stacco da Terra",
    video_url: null,
    muscles: ["Erettori Spinali", "Grande Gluteo", "Ischiocrurali"],
    secondary_muscles: ["Quadricipiti", "Trapezi (superiori)"],
    tracking_fields: ["sets", "reps", "weight", "rpe", "tempo"],
    movement_pattern: "hinge",
    exercise_type: "Multi-articolare",
    notes: null,
    archived: false,
  },
  {
    name: "Lat Pulldown",
    video_url: null,
    muscles: ["Gran Dorsale"],
    secondary_muscles: ["Bicipiti (capo lungo)", "Bicipiti (capo corto)"],
    tracking_fields: ["sets", "reps", "weight", "rpe"],
    movement_pattern: "tirata_verticale",
    exercise_type: "Multi-articolare",
    notes: null,
    archived: false,
  },
  {
    name: "Alzate Laterali",
    video_url: null,
    muscles: ["Deltoidi (mediali)"],
    secondary_muscles: [],
    tracking_fields: ["sets", "reps", "weight"],
    movement_pattern: null,
    exercise_type: "Mono-articolare",
    notes: null,
    archived: false,
  },
  {
    name: "Squat con Bilanciere",
    video_url: null,
    muscles: ["Quadricipiti", "Grande Gluteo"],
    secondary_muscles: ["Erettori Spinali"],
    tracking_fields: ["sets", "reps", "weight", "rpe", "tempo"],
    movement_pattern: "squat",
    exercise_type: "Multi-articolare",
    notes: null,
    archived: false,
  },
  {
    name: "Leg Curl",
    video_url: null,
    muscles: ["Ischiocrurali"],
    secondary_muscles: ["Polpacci (gastrocnemio)"],
    tracking_fields: ["sets", "reps", "weight"],
    movement_pattern: null,
    exercise_type: "Mono-articolare",
    notes: null,
    archived: false,
  },
  {
    name: "Croci ai Cavi",
    video_url: null,
    muscles: ["Pettorali (c. sternali)", "Pettorali (c. costali)"],
    secondary_muscles: [],
    tracking_fields: ["sets", "reps", "weight"],
    movement_pattern: null,
    exercise_type: "Mono-articolare",
    notes: null,
    archived: false,
  },
  {
    name: "Rematore con Manubrio",
    video_url: null,
    muscles: ["Gran Dorsale"],
    secondary_muscles: ["Trapezi (medi)", "Bicipiti (capo corto)"],
    tracking_fields: ["sets", "reps", "weight", "rpe"],
    movement_pattern: "tirata_orizzontale",
    exercise_type: "Multi-articolare",
    notes: null,
    archived: false,
  },
];

// Convert muscle tags to grouped options for MultiSelect
const muscleOptions: GroupedOptions[] = getMusclesGrouped().map((group) => ({
  group: group.category,
  options: group.muscles.map((muscle) => ({
    value: muscle,
    label: muscle,
  })),
}));

// Muscle groups for accordion filter (Macro -> Micro mapping)
const MUSCLE_GROUPS = Object.entries(MUSCLE_TAGS).map(([key, val]) => ({
  key,
  label: val.label,
  muscles: val.muscles as readonly string[],
}));

export default function ExerciseLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseType, setSelectedExerciseType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formMuscles, setFormMuscles] = useState<string[]>([]);
  const [formSecondaryMuscles, setFormSecondaryMuscles] = useState<string[]>([]);
  const [formTrackingFields, setFormTrackingFields] = useState<string[]>(["sets", "reps", "weight"]);
  const [formPattern, setFormPattern] = useState("");
  const [formExerciseType, setFormExerciseType] = useState("Multi-articolare");

  // Fetch exercises
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercises", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("coach_id", user.id)
        .order("name");
      if (error) throw error;
      return data as Exercise[];
    },
    enabled: !!user?.id,
  });

  // Create exercise mutation
  const createMutation = useMutation({
    mutationFn: async (exercise: Omit<Exercise, "id" | "coach_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          ...exercise,
          coach_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Esercizio creato con successo!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Errore nella creazione: " + error.message);
    },
  });

  // Update exercise mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...exercise }: Partial<Exercise> & { id: string }) => {
      const { data, error } = await supabase
        .from("exercises")
        .update(exercise)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Esercizio aggiornato!");
      resetForm();
      setDialogOpen(false);
      setEditingExercise(null);
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento: " + error.message);
    },
  });

  // Archive exercise mutation (soft delete)
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("exercises")
        .update({ archived: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Esercizio archiviato!");
    },
    onError: (error) => {
      toast.error("Errore nell'archiviazione: " + error.message);
    },
  });

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormVideoUrl("");
    setFormMuscles([]);
    setFormSecondaryMuscles([]);
    setFormTrackingFields(["sets", "reps", "weight"]);
    setFormPattern("");
    setFormExerciseType("Multi-articolare");
  };

  // Open edit dialog
  const openEditDialog = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormVideoUrl(exercise.video_url || "");
    setFormMuscles(exercise.muscles || []);
    setFormSecondaryMuscles(exercise.secondary_muscles || []);
    setFormTrackingFields(exercise.tracking_fields || ["sets", "reps", "weight"]);
    setFormPattern(exercise.movement_pattern || "");
    setFormExerciseType(exercise.exercise_type || "Multi-articolare");
    setDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }

    if (!formExerciseType) {
      toast.error("Il tipo di esercizio è obbligatorio");
      return;
    }

    const exerciseData = {
      name: formName.trim(),
      video_url: formVideoUrl.trim() || null,
      muscles: formMuscles,
      secondary_muscles: formSecondaryMuscles,
      tracking_fields: formTrackingFields,
      movement_pattern: formPattern || null,
      exercise_type: formExerciseType,
      notes: null,
      archived: false,
    };

    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, ...exerciseData });
    } else {
      createMutation.mutate(exerciseData);
    }
  };

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));

      // Exercise type filter
      const matchesType =
        !selectedExerciseType || ex.exercise_type === selectedExerciseType;

      // Pattern filter
      const matchesPattern = !selectedPattern || ex.movement_pattern === selectedPattern;

      // Muscle filter - check if any selected micro-muscle is in the exercise's muscles
      const matchesMuscles =
        selectedMuscles.length === 0 ||
        ex.muscles.some((m) => selectedMuscles.includes(m));

      return matchesSearch && matchesType && matchesPattern && matchesMuscles;
    });
  }, [exercises, searchQuery, selectedExerciseType, selectedPattern, selectedMuscles]);

  // Clear filters
  const clearFilters = () => {
    setSelectedExerciseType(null);
    setSelectedPattern(null);
    setSelectedMuscles([]);
    setSearchQuery("");
  };

  // Toggle muscle selection
  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  // Toggle all muscles in a group
  const toggleMuscleGroup = (muscles: readonly string[]) => {
    const allSelected = muscles.every((m) => selectedMuscles.includes(m));
    if (allSelected) {
      setSelectedMuscles((prev) => prev.filter((m) => !muscles.includes(m)));
    } else {
      setSelectedMuscles((prev) => [...new Set([...prev, ...muscles])]);
    }
  };

  const hasActiveFilters =
    selectedExerciseType || selectedPattern || selectedMuscles.length > 0 || searchQuery;

  return (
    <CoachLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Filter Sidebar */}
        <div className="w-72 border-r border-border bg-card/50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Filtri
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                Reset
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Section 1: Exercise Type */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Tipo di Esercizio
                </Label>
                <div className="flex flex-wrap gap-2">
                  {EXERCISE_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedExerciseType === type.value ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() =>
                        setSelectedExerciseType(
                          selectedExerciseType === type.value ? null : type.value
                        )
                      }
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Section 2: Movement Pattern (Schema Motorio) */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Schema Motorio
                </Label>
                <div className="space-y-1">
                  {MOVEMENT_PATTERNS.map((pattern) => (
                    <Button
                      key={pattern.value}
                      variant={selectedPattern === pattern.value ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() =>
                        setSelectedPattern(
                          selectedPattern === pattern.value ? null : pattern.value
                        )
                      }
                    >
                      {pattern.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Section 3: Muscle Groups (Accordion) */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Muscoli Primari
                </Label>
                <Accordion type="multiple" className="w-full">
                  {MUSCLE_GROUPS.map((group) => {
                    const groupMuscles = group.muscles;
                    const selectedCount = groupMuscles.filter((m) =>
                      selectedMuscles.includes(m)
                    ).length;
                    const allSelected =
                      groupMuscles.length > 0 &&
                      groupMuscles.every((m) => selectedMuscles.includes(m));

                    return (
                      <AccordionItem key={group.key} value={group.key} className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{group.label}</span>
                            {selectedCount > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                {selectedCount}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="space-y-2 pl-1">
                            {/* Select All checkbox */}
                            <div className="flex items-center space-x-2 pb-1 border-b border-border/50">
                              <Checkbox
                                id={`all-${group.key}`}
                                checked={allSelected}
                                onCheckedChange={() => toggleMuscleGroup(groupMuscles)}
                              />
                              <label
                                htmlFor={`all-${group.key}`}
                                className="text-xs font-medium cursor-pointer"
                              >
                                Tutti ({group.label})
                              </label>
                            </div>
                            {/* Individual muscle checkboxes */}
                            {groupMuscles.map((muscle) => (
                              <div key={muscle} className="flex items-center space-x-2">
                                <Checkbox
                                  id={muscle}
                                  checked={selectedMuscles.includes(muscle)}
                                  onCheckedChange={() => toggleMuscle(muscle)}
                                />
                                <label
                                  htmlFor={muscle}
                                  className="text-xs cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {muscle}
                                </label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border bg-background">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Dumbbell className="h-6 w-6 text-primary" />
                  Libreria Esercizi
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Database centrale dei movimenti per la programmazione ibrida
                </p>
              </div>
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setEditingExercise(null);
                    resetForm();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Esercizio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExercise ? "Modifica Esercizio" : "Nuovo Esercizio"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingExercise
                        ? "Modifica i dettagli dell'esercizio"
                        : "Aggiungi un nuovo esercizio alla libreria"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="es. Panca Piana con Bilanciere"
                      />
                    </div>

                    {/* Video URL */}
                    <div className="space-y-2">
                      <Label htmlFor="video">Video URL</Label>
                      <Input
                        id="video"
                        value={formVideoUrl}
                        onChange={(e) => setFormVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>

                    {/* Exercise Type */}
                    <div className="space-y-2">
                      <Label>Tipo di Esercizio *</Label>
                      <Select value={formExerciseType} onValueChange={setFormExerciseType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {EXERCISE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tracking Metrics Builder */}
                    <div className="border border-border rounded-lg p-4 bg-secondary/20">
                      <TrackingMetricBuilder
                        value={formTrackingFields}
                        onChange={setFormTrackingFields}
                      />
                    </div>

                    {/* Movement Pattern (Schema Motorio) */}
                    <div className="space-y-2">
                      <Label>Schema Motorio</Label>
                      <Select value={formPattern} onValueChange={setFormPattern}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona pattern..." />
                        </SelectTrigger>
                        <SelectContent>
                          {MOVEMENT_PATTERNS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Muscles Multi-Select */}
                    <div className="space-y-2">
                      <Label>Muscoli Primari</Label>
                      <MultiSelect
                        options={muscleOptions}
                        selected={formMuscles}
                        onChange={setFormMuscles}
                        placeholder="Seleziona muscoli target..."
                        searchPlaceholder="Cerca muscolo..."
                        emptyMessage="Nessun muscolo trovato"
                      />
                    </div>

                    {/* Secondary Muscles Multi-Select */}
                    <div className="space-y-2">
                      <Label>Muscoli Secondari</Label>
                      <MultiSelect
                        options={muscleOptions}
                        selected={formSecondaryMuscles}
                        onChange={setFormSecondaryMuscles}
                        placeholder="Seleziona muscoli sinergici..."
                        searchPlaceholder="Cerca muscolo..."
                        emptyMessage="Nessun muscolo trovato"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingExercise(null);
                        resetForm();
                      }}
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {editingExercise ? "Salva Modifiche" : "Crea Esercizio"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o muscolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Exercise List */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredExercises.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {exercises.length === 0
                        ? "Nessun esercizio nella libreria"
                        : "Nessun esercizio trovato"}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                      {exercises.length === 0
                        ? "Inizia aggiungendo il tuo primo esercizio alla libreria."
                        : "Prova a modificare i filtri o la ricerca."}
                    </p>
                    {exercises.length === 0 && (
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Esercizio
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredExercises.map((exercise) => (
                    <Card
                      key={exercise.id}
                      className="hover:border-primary/30 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Video Thumbnail / Placeholder */}
                          <div className="w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden">
                            {exercise.video_url ? (
                              <div className="relative w-full h-full bg-black/10 flex items-center justify-center group cursor-pointer">
                                <Play className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                              </div>
                            ) : (
                              <Video className="h-6 w-6 text-muted-foreground/50" />
                            )}
                          </div>

                          {/* Exercise Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{exercise.name}</h4>
                              {exercise.exercise_type && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {exercise.exercise_type}
                                </Badge>
                              )}
                              {exercise.movement_pattern && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {MOVEMENT_PATTERNS.find(
                                    (p) => p.value === exercise.movement_pattern
                                  )?.label || exercise.movement_pattern}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {exercise.muscles.slice(0, 4).map((muscle) => (
                                <Badge
                                  key={muscle}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-0"
                                >
                                  {muscle}
                                </Badge>
                              ))}
                              {exercise.muscles.length > 4 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-5"
                                >
                                  +{exercise.muscles.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(exercise)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Archivia Esercizio</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler archiviare "{exercise.name}"? L'esercizio
                                    sarà nascosto dalla libreria ma i log degli atleti saranno preservati.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => archiveMutation.mutate(exercise.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Archivia
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </CoachLayout>
  );
}
