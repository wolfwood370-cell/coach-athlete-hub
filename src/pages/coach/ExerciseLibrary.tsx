import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  MUSCLE_TAGS,
  MOVEMENT_PATTERNS,
  getMusclesGrouped,
  getMuscleCategory,
} from "@/lib/muscleTags";

// Types
interface Exercise {
  id: string;
  name: string;
  video_url: string | null;
  muscles: string[];
  movement_pattern: string | null;
  default_rpe: number | null;
  is_compound: boolean;
  notes: string | null;
  coach_id: string;
  created_at: string;
  updated_at: string;
}

// Sample exercises for initial data
const SAMPLE_EXERCISES: Omit<Exercise, "id" | "coach_id" | "created_at" | "updated_at">[] = [
  {
    name: "Panca Inclinata con Manubri",
    video_url: null,
    muscles: ["Pettorali (c. clavicolari)", "Deltoidi (anteriori)", "Tricipiti (capo lungo)"],
    movement_pattern: "push",
    default_rpe: 7,
    is_compound: true,
    notes: null,
  },
  {
    name: "Stacco da Terra",
    video_url: null,
    muscles: ["Erettori Spinali", "Grande Gluteo", "Ischiocrurali", "Quadricipiti", "Trapezi (superiori)"],
    movement_pattern: "hinge",
    default_rpe: 8,
    is_compound: true,
    notes: null,
  },
  {
    name: "Lat Pulldown",
    video_url: null,
    muscles: ["Gran Dorsale", "Bicipiti (capo lungo)", "Bicipiti (capo corto)"],
    movement_pattern: "pull",
    default_rpe: 7,
    is_compound: true,
    notes: null,
  },
  {
    name: "Alzate Laterali",
    video_url: null,
    muscles: ["Deltoidi (mediali)"],
    movement_pattern: "isolation",
    default_rpe: 6,
    is_compound: false,
    notes: null,
  },
  {
    name: "Squat con Bilanciere",
    video_url: null,
    muscles: ["Quadricipiti", "Grande Gluteo", "Erettori Spinali"],
    movement_pattern: "squat",
    default_rpe: 8,
    is_compound: true,
    notes: null,
  },
  {
    name: "Leg Curl",
    video_url: null,
    muscles: ["Ischiocrurali", "Polpacci (gastrocnemio)"],
    movement_pattern: "isolation",
    default_rpe: 6,
    is_compound: false,
    notes: null,
  },
  {
    name: "Croci ai Cavi",
    video_url: null,
    muscles: ["Pettorali (c. sternali)", "Pettorali (c. costali)"],
    movement_pattern: "isolation",
    default_rpe: 6,
    is_compound: false,
    notes: null,
  },
  {
    name: "Rematore con Manubrio",
    video_url: null,
    muscles: ["Gran Dorsale", "Trapezi (medi)", "Bicipiti (capo corto)"],
    movement_pattern: "pull",
    default_rpe: 7,
    is_compound: true,
    notes: null,
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

// Macro categories for filtering
const MACRO_CATEGORIES = Object.entries(MUSCLE_TAGS).map(([key, val]) => ({
  key,
  label: val.label,
}));

export default function ExerciseLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formMuscles, setFormMuscles] = useState<string[]>([]);
  const [formPattern, setFormPattern] = useState("");
  const [formRpe, setFormRpe] = useState("");
  const [formIsCompound, setFormIsCompound] = useState(false);

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

  // Delete exercise mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Esercizio eliminato!");
    },
    onError: (error) => {
      toast.error("Errore nell'eliminazione: " + error.message);
    },
  });

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormVideoUrl("");
    setFormMuscles([]);
    setFormPattern("");
    setFormRpe("");
    setFormIsCompound(false);
  };

  // Open edit dialog
  const openEditDialog = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormVideoUrl(exercise.video_url || "");
    setFormMuscles(exercise.muscles || []);
    setFormPattern(exercise.movement_pattern || "");
    setFormRpe(exercise.default_rpe?.toString() || "");
    setFormIsCompound(exercise.is_compound);
    setDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }

    const exerciseData = {
      name: formName.trim(),
      video_url: formVideoUrl.trim() || null,
      muscles: formMuscles,
      movement_pattern: formPattern || null,
      default_rpe: formRpe ? parseInt(formRpe, 10) : null,
      is_compound: formIsCompound,
      notes: null,
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

      // Category filter
      const matchesCategory =
        !selectedCategory ||
        ex.muscles.some((m) => {
          const category = getMuscleCategory(m);
          return category === MUSCLE_TAGS[selectedCategory as keyof typeof MUSCLE_TAGS]?.label;
        });

      // Pattern filter
      const matchesPattern = !selectedPattern || ex.movement_pattern === selectedPattern;

      return matchesSearch && matchesCategory && matchesPattern;
    });
  }, [exercises, searchQuery, selectedCategory, selectedPattern]);

  // Clear filters
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedPattern(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedCategory || selectedPattern || searchQuery;

  return (
    <CoachLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Filter Sidebar */}
        <div className="w-64 border-r border-border bg-card/50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
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

          {/* Macro Category Filter */}
          <div className="space-y-2 mb-6">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Categoria
            </Label>
            <div className="space-y-1">
              {MACRO_CATEGORIES.map((cat) => (
                <Button
                  key={cat.key}
                  variant={selectedCategory === cat.key ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm h-8"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.key ? null : cat.key)
                  }
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Movement Pattern Filter */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Pattern di Movimento
            </Label>
            <div className="space-y-1">
              {MOVEMENT_PATTERNS.map((pattern) => (
                <Button
                  key={pattern.value}
                  variant={selectedPattern === pattern.value ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm h-8"
                  onClick={() =>
                    setSelectedPattern(selectedPattern === pattern.value ? null : pattern.value)
                  }
                >
                  {pattern.label}
                </Button>
              ))}
            </div>
          </div>
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
                <DialogContent className="max-w-lg">
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

                    {/* Muscles Multi-Select */}
                    <div className="space-y-2">
                      <Label>Muscoli Primari *</Label>
                      <MultiSelect
                        options={muscleOptions}
                        selected={formMuscles}
                        onChange={setFormMuscles}
                        placeholder="Seleziona muscoli target..."
                        searchPlaceholder="Cerca muscolo..."
                        emptyMessage="Nessun muscolo trovato"
                      />
                    </div>

                    {/* Movement Pattern */}
                    <div className="space-y-2">
                      <Label>Pattern di Movimento</Label>
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

                    {/* Default RPE */}
                    <div className="space-y-2">
                      <Label htmlFor="rpe">RPE Default (opzionale)</Label>
                      <Input
                        id="rpe"
                        type="number"
                        min="1"
                        max="10"
                        value={formRpe}
                        onChange={(e) => setFormRpe(e.target.value)}
                        placeholder="7"
                      />
                    </div>

                    {/* Is Compound */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="compound"
                        checked={formIsCompound}
                        onCheckedChange={(checked) => setFormIsCompound(checked === true)}
                      />
                      <Label htmlFor="compound" className="text-sm font-normal cursor-pointer">
                        Esercizio Composto (multi-articolare)
                      </Label>
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
                              {exercise.is_compound && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  Composto
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
                                  <AlertDialogTitle>Elimina Esercizio</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare "{exercise.name}"? Questa azione
                                    non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(exercise.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Elimina
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
