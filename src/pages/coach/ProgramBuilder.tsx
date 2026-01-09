import { useState, useRef, useEffect, useCallback } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GripVertical, 
  Dumbbell, 
  X,
  Save,
  RotateCcw,
  Search,
  Copy,
  Trash2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Days of week
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = 4;

// Mock exercise library with categories
const exerciseLibrary = [
  { id: "squat", name: "Squat", category: "Legs", defaultPercent: 85 },
  { id: "bench", name: "Bench Press", category: "Chest", defaultPercent: 75 },
  { id: "deadlift", name: "Deadlift", category: "Back", defaultPercent: 90 },
  { id: "ohp", name: "Overhead Press", category: "Shoulders", defaultPercent: 55 },
  { id: "row", name: "Barbell Row", category: "Back", defaultPercent: 65 },
  { id: "rdl", name: "Romanian Deadlift", category: "Legs", defaultPercent: 70 },
  { id: "pullups", name: "Pull-ups", category: "Back", defaultPercent: 0 },
  { id: "dips", name: "Dips", category: "Chest", defaultPercent: 0 },
  { id: "legpress", name: "Leg Press", category: "Legs", defaultPercent: 120 },
  { id: "latpull", name: "Lat Pulldown", category: "Back", defaultPercent: 50 },
  { id: "curls", name: "Bicep Curls", category: "Arms", defaultPercent: 25 },
  { id: "triceps", name: "Tricep Extension", category: "Arms", defaultPercent: 20 },
  { id: "lunges", name: "Walking Lunges", category: "Legs", defaultPercent: 40 },
  { id: "flyes", name: "Cable Flyes", category: "Chest", defaultPercent: 15 },
];

// Mock athletes
const athletes = [
  { id: "1", name: "Marco Rossi", oneRM: 140 },
  { id: "2", name: "Giulia Verdi", oneRM: 80 },
  { id: "3", name: "Luca Ferrari", oneRM: 120 },
  { id: "4", name: "Sara Conti", oneRM: 70 },
];

interface ExerciseEntry {
  id: string;
  raw: string; // Raw input text
  parsed: {
    name: string;
    sets: number;
    reps: number;
    percent: number | null;
    kg: number | null;
  } | null;
}

interface CellData {
  exercises: ExerciseEntry[];
  isEditing: boolean;
  editValue: string;
}

type GridData = CellData[][];

// Parse exercise string like "Squat 4x8 @ 75%" or "Squat 4x8 @ 100kg"
function parseExerciseInput(input: string, oneRM: number): ExerciseEntry["parsed"] {
  if (!input.trim()) return null;
  
  // Pattern: "Exercise Name NxM @ X%" or "Exercise Name NxM @ Xkg"
  const regex = /^(.+?)\s*(\d+)\s*[xX×]\s*(\d+)\s*(?:@\s*(\d+(?:\.\d+)?)\s*(%|kg)?)?$/i;
  const match = input.trim().match(regex);
  
  if (match) {
    const [, name, sets, reps, weight, unit] = match;
    const numWeight = weight ? parseFloat(weight) : null;
    
    let percent: number | null = null;
    let kg: number | null = null;
    
    if (unit === '%' && numWeight) {
      percent = numWeight;
      kg = Math.round(oneRM * (numWeight / 100));
    } else if (unit === 'kg' && numWeight) {
      kg = numWeight;
      percent = Math.round((numWeight / oneRM) * 100);
    }
    
    return {
      name: name.trim(),
      sets: parseInt(sets),
      reps: parseInt(reps),
      percent,
      kg,
    };
  }
  
  // Fallback: just treat it as a name
  return {
    name: input.trim(),
    sets: 0,
    reps: 0,
    percent: null,
    kg: null,
  };
}

const ProgramBuilder = () => {
  const [selectedAthlete, setSelectedAthlete] = useState(athletes[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedExercise, setDraggedExercise] = useState<typeof exerciseLibrary[0] | null>(null);
  const [activeCell, setActiveCell] = useState<{ week: number; day: number } | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  
  const [grid, setGrid] = useState<GridData>(() =>
    Array(WEEKS).fill(null).map(() =>
      Array(7).fill(null).map(() => ({
        exercises: [],
        isEditing: false,
        editValue: "",
      }))
    )
  );

  const filteredExercises = exerciseLibrary.filter(
    ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCellClick = useCallback((week: number, day: number) => {
    setActiveCell({ week, day });
    setGrid(prev => {
      const newGrid = prev.map((w, wi) =>
        w.map((d, di) => ({
          ...d,
          isEditing: wi === week && di === day,
        }))
      );
      return newGrid;
    });
    
    // Focus the input after state update
    setTimeout(() => {
      const key = `${week}-${day}`;
      inputRefs.current[key]?.focus();
    }, 0);
  }, []);

  const handleInputChange = useCallback((week: number, day: number, value: string) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[week] = [...newGrid[week]];
      newGrid[week][day] = {
        ...newGrid[week][day],
        editValue: value,
      };
      return newGrid;
    });
  }, []);

  const handleInputBlur = useCallback((week: number, day: number) => {
    setGrid(prev => {
      const newGrid = [...prev];
      const cell = newGrid[week][day];
      
      if (cell.editValue.trim()) {
        const lines = cell.editValue.split('\n').filter(l => l.trim());
        const newExercises: ExerciseEntry[] = lines.map((line, idx) => ({
          id: `${Date.now()}-${idx}`,
          raw: line,
          parsed: parseExerciseInput(line, selectedAthlete.oneRM),
        }));
        
        newGrid[week] = [...newGrid[week]];
        newGrid[week][day] = {
          exercises: [...cell.exercises, ...newExercises],
          isEditing: false,
          editValue: "",
        };
      } else {
        newGrid[week] = [...newGrid[week]];
        newGrid[week][day] = {
          ...cell,
          isEditing: false,
        };
      }
      
      return newGrid;
    });
    setActiveCell(null);
  }, [selectedAthlete.oneRM]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, week: number, day: number) => {
    if (e.key === 'Escape') {
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[week] = [...newGrid[week]];
        newGrid[week][day] = {
          ...newGrid[week][day],
          isEditing: false,
          editValue: "",
        };
        return newGrid;
      });
      setActiveCell(null);
    }
  }, []);

  const handleDrop = useCallback((week: number, day: number, exercise: typeof exerciseLibrary[0]) => {
    const defaultInput = `${exercise.name} 3x8${exercise.defaultPercent ? ` @ ${exercise.defaultPercent}%` : ''}`;
    const parsed = parseExerciseInput(defaultInput, selectedAthlete.oneRM);
    
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[week] = [...newGrid[week]];
      newGrid[week][day] = {
        ...newGrid[week][day],
        exercises: [
          ...newGrid[week][day].exercises,
          { id: `${Date.now()}`, raw: defaultInput, parsed },
        ],
      };
      return newGrid;
    });
    setDraggedExercise(null);
  }, [selectedAthlete.oneRM]);

  const removeExercise = useCallback((week: number, day: number, exerciseId: string) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[week] = [...newGrid[week]];
      newGrid[week][day] = {
        ...newGrid[week][day],
        exercises: newGrid[week][day].exercises.filter(e => e.id !== exerciseId),
      };
      return newGrid;
    });
  }, []);

  const copyWeek = useCallback((weekIndex: number) => {
    if (weekIndex < WEEKS - 1) {
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[weekIndex + 1] = prev[weekIndex].map(cell => ({
          ...cell,
          exercises: cell.exercises.map(ex => ({ ...ex, id: `${Date.now()}-${Math.random()}` })),
          isEditing: false,
        }));
        return newGrid;
      });
    }
  }, []);

  const clearWeek = useCallback((weekIndex: number) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[weekIndex] = Array(7).fill(null).map(() => ({
        exercises: [],
        isEditing: false,
        editValue: "",
      }));
      return newGrid;
    });
  }, []);

  const resetGrid = useCallback(() => {
    setGrid(
      Array(WEEKS).fill(null).map(() =>
        Array(7).fill(null).map(() => ({
          exercises: [],
          isEditing: false,
          editValue: "",
        }))
      )
    );
    setActiveCell(null);
  }, []);

  // Recalculate weights when athlete changes
  useEffect(() => {
    setGrid(prev =>
      prev.map(week =>
        week.map(day => ({
          ...day,
          exercises: day.exercises.map(ex => ({
            ...ex,
            parsed: ex.raw ? parseExerciseInput(ex.raw, selectedAthlete.oneRM) : null,
          })),
        }))
      )
    );
  }, [selectedAthlete.oneRM]);

  return (
    <CoachLayout title="Program Builder" subtitle="Crea schede di allenamento Excel-style">
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
                  value={selectedAthlete.id} 
                  onValueChange={(id) => setSelectedAthlete(athletes.find(a => a.id === id) || athletes[0])}
                >
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map(athlete => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 1RM Display */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary">
                <Label className="text-xs text-muted-foreground">1RM Squat</Label>
                <span className="text-sm font-semibold tabular-nums">{selectedAthlete.oneRM} kg</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetGrid} className="h-8">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
              <Button size="sm" className="h-8 bg-primary">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Salva
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
                        <span className="text-xs font-medium">Week {weekIndex + 1}</span>
                        <div className="flex gap-1 opacity-0 group-hover/week:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyWeek(weekIndex)}
                            title="Copy to next week"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={() => clearWeek(weekIndex)}
                            title="Clear week"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Day Cells */}
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const cell = grid[weekIndex][dayIndex];
                        const isActive = activeCell?.week === weekIndex && activeCell?.day === dayIndex;
                        const cellKey = `${weekIndex}-${dayIndex}`;
                        
                        return (
                          <div
                            key={dayIndex}
                            className={cn(
                              "min-h-[100px] border-r border-border/50 last:border-r-0 p-1 transition-colors cursor-text",
                              isActive && "bg-primary/5 ring-1 ring-inset ring-primary",
                              !isActive && "hover:bg-muted/20",
                              draggedExercise && "hover:bg-primary/10"
                            )}
                            onClick={() => !cell.isEditing && handleCellClick(weekIndex, dayIndex)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('bg-primary/20');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('bg-primary/20');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('bg-primary/20');
                              if (draggedExercise) {
                                handleDrop(weekIndex, dayIndex, draggedExercise);
                              }
                            }}
                          >
                            {/* Existing Exercises */}
                            <div className="space-y-1">
                              {cell.exercises.map((exercise) => (
                                <div
                                  key={exercise.id}
                                  className="group/ex relative bg-background rounded px-1.5 py-1 text-[11px] border border-border/50 hover:border-primary/30"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeExercise(weekIndex, dayIndex, exercise.id);
                                    }}
                                    className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover/ex:opacity-100 transition-opacity flex items-center justify-center z-10"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                  
                                  {exercise.parsed ? (
                                    <div>
                                      <p className="font-medium truncate">{exercise.parsed.name}</p>
                                      {exercise.parsed.sets > 0 && (
                                        <p className="text-muted-foreground tabular-nums">
                                          {exercise.parsed.sets}×{exercise.parsed.reps}
                                          {exercise.parsed.kg && (
                                            <span className="text-primary ml-1">
                                              @ {exercise.parsed.kg}kg
                                              {exercise.parsed.percent && (
                                                <span className="text-muted-foreground/70 ml-0.5">
                                                  ({exercise.parsed.percent}%)
                                                </span>
                                              )}
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">{exercise.raw}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Inline Input */}
                            {cell.isEditing && (
                              <textarea
                                ref={(el) => { inputRefs.current[cellKey] = el; }}
                                value={cell.editValue}
                                onChange={(e) => handleInputChange(weekIndex, dayIndex, e.target.value)}
                                onBlur={() => handleInputBlur(weekIndex, dayIndex)}
                                onKeyDown={(e) => handleKeyDown(e, weekIndex, dayIndex)}
                                placeholder="Squat 4x8 @ 75%"
                                className="w-full min-h-[60px] text-[11px] bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground/50"
                                autoFocus
                              />
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

          {/* Help Text */}
          <p className="text-[10px] text-muted-foreground text-center">
            Clicca una cella per scrivere · Formato: <code className="bg-muted px-1 rounded">Squat 4x8 @ 75%</code> oppure <code className="bg-muted px-1 rounded">Bench 3x10 @ 60kg</code> · I pesi si calcolano automaticamente dal 1RM
          </p>
        </div>

        {/* Exercise Library Sidebar */}
        <Card className="w-64 flex-shrink-0 border-0 shadow-sm">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Exercise Library
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
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
    </CoachLayout>
  );
};

export default ProgramBuilder;
