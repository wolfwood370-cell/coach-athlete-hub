import { useState } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  GripVertical, 
  Dumbbell, 
  X,
  Save,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock exercise library
const exerciseLibrary = [
  { id: "1", name: "Squat", category: "Gambe", baseWeight: 0.85 },
  { id: "2", name: "Bench Press", category: "Petto", baseWeight: 0.75 },
  { id: "3", name: "Deadlift", category: "Schiena", baseWeight: 0.90 },
  { id: "4", name: "Overhead Press", category: "Spalle", baseWeight: 0.55 },
  { id: "5", name: "Barbell Row", category: "Schiena", baseWeight: 0.65 },
  { id: "6", name: "Romanian Deadlift", category: "Gambe", baseWeight: 0.70 },
  { id: "7", name: "Pull-ups", category: "Schiena", baseWeight: 0 },
  { id: "8", name: "Dips", category: "Petto", baseWeight: 0 },
  { id: "9", name: "Leg Press", category: "Gambe", baseWeight: 1.2 },
  { id: "10", name: "Lat Pulldown", category: "Schiena", baseWeight: 0.5 },
];

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  baseWeight: number;
}

interface DayProgram {
  exercises: Exercise[];
}

type WeekProgram = DayProgram[];
type ProgramGrid = WeekProgram[];

const WEEKS = 4;
const DAYS = 5;

const ProgramBuilder = () => {
  const [oneRepMax, setOneRepMax] = useState<number>(100);
  const [selectedCell, setSelectedCell] = useState<{ week: number; day: number } | null>(null);
  const [programGrid, setProgramGrid] = useState<ProgramGrid>(() => 
    Array(WEEKS).fill(null).map(() => 
      Array(DAYS).fill(null).map(() => ({ exercises: [] }))
    )
  );
  const [draggedExercise, setDraggedExercise] = useState<typeof exerciseLibrary[0] | null>(null);

  const calculateWeight = (baseWeight: number) => {
    if (baseWeight === 0) return "BW";
    return Math.round(oneRepMax * baseWeight);
  };

  const handleAddExercise = (exercise: typeof exerciseLibrary[0]) => {
    if (!selectedCell) return;
    
    const { week, day } = selectedCell;
    const newExercise: Exercise = {
      id: `${exercise.id}-${Date.now()}`,
      name: exercise.name,
      sets: 3,
      reps: 8,
      weight: exercise.baseWeight,
      baseWeight: exercise.baseWeight,
    };

    setProgramGrid(prev => {
      const newGrid = [...prev];
      newGrid[week] = [...newGrid[week]];
      newGrid[week][day] = {
        exercises: [...newGrid[week][day].exercises, newExercise]
      };
      return newGrid;
    });
  };

  const handleRemoveExercise = (week: number, day: number, exerciseId: string) => {
    setProgramGrid(prev => {
      const newGrid = [...prev];
      newGrid[week] = [...newGrid[week]];
      newGrid[week][day] = {
        exercises: newGrid[week][day].exercises.filter(e => e.id !== exerciseId)
      };
      return newGrid;
    });
  };

  const handleCellClick = (week: number, day: number) => {
    setSelectedCell(prev => 
      prev?.week === week && prev?.day === day ? null : { week, day }
    );
  };

  const handleDragStart = (exercise: typeof exerciseLibrary[0]) => {
    setDraggedExercise(exercise);
  };

  const handleDragEnd = () => {
    setDraggedExercise(null);
  };

  const handleDrop = (week: number, day: number) => {
    if (draggedExercise) {
      const newExercise: Exercise = {
        id: `${draggedExercise.id}-${Date.now()}`,
        name: draggedExercise.name,
        sets: 3,
        reps: 8,
        weight: draggedExercise.baseWeight,
        baseWeight: draggedExercise.baseWeight,
      };

      setProgramGrid(prev => {
        const newGrid = [...prev];
        newGrid[week] = [...newGrid[week]];
        newGrid[week][day] = {
          exercises: [...newGrid[week][day].exercises, newExercise]
        };
        return newGrid;
      });
      setDraggedExercise(null);
    }
  };

  const resetProgram = () => {
    setProgramGrid(
      Array(WEEKS).fill(null).map(() => 
        Array(DAYS).fill(null).map(() => ({ exercises: [] }))
      )
    );
    setSelectedCell(null);
  };

  return (
    <CoachLayout title="Program Builder" subtitle="Crea e gestisci schede di allenamento">
      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Header Controls */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="oneRepMax" className="text-sm font-medium whitespace-nowrap">
                      Massimale Atleta (1RM)
                    </Label>
                    <div className="relative">
                      <Input
                        id="oneRepMax"
                        type="number"
                        value={oneRepMax}
                        onChange={(e) => setOneRepMax(Number(e.target.value) || 0)}
                        className="w-24 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        kg
                      </span>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <p className="text-sm text-muted-foreground">
                    I pesi si aggiornano automaticamente in base al 1RM
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={resetProgram}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Save className="h-4 w-4 mr-2" />
                    Salva Programma
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid */}
          <Card className="flex-1 overflow-hidden border-border/50">
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-[100px_repeat(5,1fr)] border-b border-border bg-muted/30 sticky top-0 z-10">
                    <div className="p-3 font-medium text-sm text-muted-foreground border-r border-border">
                      Settimana
                    </div>
                    {Array.from({ length: DAYS }).map((_, dayIndex) => (
                      <div 
                        key={dayIndex} 
                        className="p-3 font-medium text-sm text-center border-r border-border last:border-r-0"
                      >
                        Giorno {dayIndex + 1}
                      </div>
                    ))}
                  </div>

                  {/* Week Rows */}
                  {Array.from({ length: WEEKS }).map((_, weekIndex) => (
                    <div 
                      key={weekIndex} 
                      className="grid grid-cols-[100px_repeat(5,1fr)] border-b border-border last:border-b-0"
                    >
                      <div className="p-3 font-medium text-sm bg-muted/20 border-r border-border flex items-center">
                        Settimana {weekIndex + 1}
                      </div>
                      {Array.from({ length: DAYS }).map((_, dayIndex) => {
                        const isSelected = selectedCell?.week === weekIndex && selectedCell?.day === dayIndex;
                        const dayData = programGrid[weekIndex][dayIndex];
                        
                        return (
                          <div
                            key={dayIndex}
                            className={cn(
                              "p-2 border-r border-border last:border-r-0 min-h-[120px] cursor-pointer transition-all",
                              isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                              !isSelected && "hover:bg-muted/30",
                              draggedExercise && "hover:bg-primary/20"
                            )}
                            onClick={() => handleCellClick(weekIndex, dayIndex)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(weekIndex, dayIndex)}
                          >
                            {dayData.exercises.length === 0 ? (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                  <Plus className="h-5 w-5 mx-auto mb-1 opacity-50" />
                                  <span className="text-xs">Aggiungi</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {dayData.exercises.map((exercise) => (
                                  <div
                                    key={exercise.id}
                                    className="group bg-background border border-border rounded-md p-2 text-xs relative hover:border-primary/50 transition-colors"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveExercise(weekIndex, dayIndex, exercise.id);
                                      }}
                                      className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                    <p className="font-medium truncate">{exercise.name}</p>
                                    <p className="text-muted-foreground">
                                      {exercise.sets}x{exercise.reps} @ {calculateWeight(exercise.baseWeight)}
                                      {exercise.baseWeight !== 0 && "kg"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Exercise Library Sidebar */}
        <Card className="w-72 flex-shrink-0 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Exercise Library
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Trascina o clicca per aggiungere esercizi
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="px-4 pb-4 space-y-2">
                {exerciseLibrary.map((exercise) => (
                  <div
                    key={exercise.id}
                    draggable
                    onDragStart={() => handleDragStart(exercise)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAddExercise(exercise)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing",
                      "hover:border-primary/50 hover:bg-primary/5 transition-all",
                      selectedCell && "cursor-pointer",
                      draggedExercise?.id === exercise.id && "opacity-50 ring-2 ring-primary"
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{exercise.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {exercise.category}
                        </Badge>
                        {exercise.baseWeight > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(exercise.baseWeight * 100)}% 1RM
                          </span>
                        )}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selection Hint */}
      {selectedCell && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          Settimana {selectedCell.week + 1}, Giorno {selectedCell.day + 1} selezionato — Clicca un esercizio per aggiungerlo
        </div>
      )}
    </CoachLayout>
  );
};

export default ProgramBuilder;
