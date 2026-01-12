import { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Search, 
  ChevronRight,
  Flame,
  Target,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Exercise library with categories and metadata
export const exerciseLibrary = [
  // Compound Lifts
  { id: "squat", name: "Squat", category: "Gambe", muscle: "Quadricipiti", defaultPercent: 85, compound: true },
  { id: "bench", name: "Panca Piana", category: "Petto", muscle: "Pettorali", defaultPercent: 75, compound: true },
  { id: "deadlift", name: "Stacco da Terra", category: "Schiena", muscle: "Erettori", defaultPercent: 90, compound: true },
  { id: "ohp", name: "Military Press", category: "Spalle", muscle: "Deltoidi", defaultPercent: 55, compound: true },
  { id: "row", name: "Rematore Bilanciere", category: "Schiena", muscle: "Dorsali", defaultPercent: 65, compound: true },
  { id: "rdl", name: "Stacco Rumeno", category: "Gambe", muscle: "Femorali", defaultPercent: 70, compound: true },
  { id: "front-squat", name: "Front Squat", category: "Gambe", muscle: "Quadricipiti", defaultPercent: 75, compound: true },
  
  // Pull Exercises
  { id: "pullups", name: "Trazioni", category: "Schiena", muscle: "Dorsali", defaultPercent: 0, compound: true },
  { id: "latpull", name: "Lat Machine", category: "Schiena", muscle: "Dorsali", defaultPercent: 50, compound: false },
  { id: "cable-row", name: "Pulley Basso", category: "Schiena", muscle: "Dorsali", defaultPercent: 45, compound: false },
  { id: "face-pull", name: "Face Pull", category: "Spalle", muscle: "Deltoidi Post.", defaultPercent: 20, compound: false },
  
  // Push Exercises
  { id: "incline-bench", name: "Panca Inclinata", category: "Petto", muscle: "Pettorali Alto", defaultPercent: 65, compound: true },
  { id: "dips", name: "Dips", category: "Petto", muscle: "Pettorali", defaultPercent: 0, compound: true },
  { id: "flyes", name: "Croci ai Cavi", category: "Petto", muscle: "Pettorali", defaultPercent: 15, compound: false },
  { id: "lateral-raise", name: "Alzate Laterali", category: "Spalle", muscle: "Deltoidi Lat.", defaultPercent: 10, compound: false },
  
  // Leg Exercises
  { id: "legpress", name: "Leg Press", category: "Gambe", muscle: "Quadricipiti", defaultPercent: 120, compound: true },
  { id: "leg-curl", name: "Leg Curl", category: "Gambe", muscle: "Femorali", defaultPercent: 35, compound: false },
  { id: "leg-ext", name: "Leg Extension", category: "Gambe", muscle: "Quadricipiti", defaultPercent: 40, compound: false },
  { id: "lunges", name: "Affondi", category: "Gambe", muscle: "Quadricipiti", defaultPercent: 40, compound: true },
  { id: "hip-thrust", name: "Hip Thrust", category: "Gambe", muscle: "Glutei", defaultPercent: 80, compound: true },
  
  // Arms
  { id: "curls", name: "Curl Bicipiti", category: "Braccia", muscle: "Bicipiti", defaultPercent: 25, compound: false },
  { id: "hammer-curl", name: "Hammer Curl", category: "Braccia", muscle: "Brachiale", defaultPercent: 20, compound: false },
  { id: "triceps-pushdown", name: "Tricipiti Cavo", category: "Braccia", muscle: "Tricipiti", defaultPercent: 20, compound: false },
  { id: "skull-crusher", name: "Skull Crusher", category: "Braccia", muscle: "Tricipiti", defaultPercent: 30, compound: false },
  
  // Core
  { id: "plank", name: "Plank", category: "Core", muscle: "Addominali", defaultPercent: 0, compound: false },
  { id: "cable-crunch", name: "Crunch ai Cavi", category: "Core", muscle: "Retto Addominale", defaultPercent: 30, compound: false },
  { id: "ab-wheel", name: "Ab Wheel Rollout", category: "Core", muscle: "Core", defaultPercent: 0, compound: false },
];

export type LibraryExercise = typeof exerciseLibrary[0];

const categoryIcons: Record<string, React.ReactNode> = {
  "Gambe": <Flame className="h-3 w-3" />,
  "Petto": <Target className="h-3 w-3" />,
  "Schiena": <Zap className="h-3 w-3" />,
  "Spalle": <Target className="h-3 w-3" />,
  "Braccia": <Dumbbell className="h-3 w-3" />,
  "Core": <Target className="h-3 w-3" />,
};

// Draggable exercise item
function DraggableExercise({ exercise }: { exercise: LibraryExercise }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${exercise.id}`,
    data: { type: "library-exercise", exercise },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg cursor-grab active:cursor-grabbing",
        "bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5",
        "transition-all duration-150 group",
        isDragging && "opacity-50 ring-2 ring-primary shadow-lg"
      )}
    >
      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Dumbbell className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{exercise.name}</p>
        <p className="text-[10px] text-muted-foreground">{exercise.muscle}</p>
      </div>
      {exercise.compound && (
        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
          Comp
        </Badge>
      )}
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface ExerciseLibrarySidebarProps {
  className?: string;
}

export function ExerciseLibrarySidebar({ className }: ExerciseLibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => 
    [...new Set(exerciseLibrary.map(ex => ex.category))],
    []
  );

  const filteredExercises = useMemo(() => {
    return exerciseLibrary.filter(ex => {
      const matchesSearch = searchQuery === "" || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, LibraryExercise[]> = {};
    filteredExercises.forEach(ex => {
      if (!groups[ex.category]) groups[ex.category] = [];
      groups[ex.category].push(ex);
    });
    return groups;
  }, [filteredExercises]);

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          Libreria Esercizi
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Trascina nell griglia
        </p>
        
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cerca esercizio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer text-[10px] h-5"
            onClick={() => setSelectedCategory(null)}
          >
            Tutti
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(groupedExercises).map(([category, exercises]) => (
            <div key={category}>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                {categoryIcons[category]}
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {category}
                </span>
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-auto">
                  {exercises.length}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {exercises.map(exercise => (
                  <DraggableExercise key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </div>
          ))}

          {filteredExercises.length === 0 && (
            <div className="text-center py-8">
              <Dumbbell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nessun esercizio trovato</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
