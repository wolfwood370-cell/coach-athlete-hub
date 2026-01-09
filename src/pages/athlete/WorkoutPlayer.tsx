import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import {
  Play,
  Pause,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Timer,
  X,
  RotateCcw,
  Dumbbell,
  MessageSquare,
  Flag
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetData {
  id: string;
  targetKg: number;
  targetReps: number;
  actualKg: string;
  actualReps: string;
  rpe: string;
  completed: boolean;
}

interface ExerciseData {
  id: string;
  name: string;
  videoUrl?: string;
  coachNotes?: string;
  sets: SetData[];
}

// Mock workout data
const mockWorkout = {
  id: "1",
  name: "Upper Body Hypertrophy",
  estimatedDuration: 45,
  exercises: [
    {
      id: "warmup",
      name: "Warm-up: Band Pull-Aparts",
      coachNotes: "Focus on squeezing the shoulder blades together at the end of each rep. Keep tension throughout.",
      sets: [
        { id: "w1", targetKg: 0, targetReps: 15, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "w2", targetKg: 0, targetReps: 15, actualKg: "", actualReps: "", rpe: "", completed: false },
      ]
    },
    {
      id: "ex1",
      name: "Bench Press",
      coachNotes: "Controllare la discesa (3 secondi). Rimbalzare il peso dal petto è vietato. Concentrati sulla connessione mente-muscolo.",
      sets: [
        { id: "s1", targetKg: 80, targetReps: 8, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s2", targetKg: 80, targetReps: 8, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s3", targetKg: 80, targetReps: 8, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s4", targetKg: 75, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
      ]
    },
    {
      id: "ex2",
      name: "Incline Dumbbell Press",
      coachNotes: "Angolo 30-45 gradi. Non esagerare con il peso, concentrati sullo stretch in basso.",
      sets: [
        { id: "s5", targetKg: 30, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s6", targetKg: 30, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s7", targetKg: 30, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
      ]
    },
    {
      id: "ex3",
      name: "Cable Flyes",
      coachNotes: "Mantieni un leggero piegamento dei gomiti. Squeeze al centro per 1 secondo.",
      sets: [
        { id: "s8", targetKg: 15, targetReps: 12, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s9", targetKg: 15, targetReps: 12, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s10", targetKg: 15, targetReps: 12, actualKg: "", actualReps: "", rpe: "", completed: false },
      ]
    },
    {
      id: "ex4",
      name: "Lat Pulldown",
      coachNotes: "Tira verso il petto, non dietro la testa. Controlla la fase eccentrica.",
      sets: [
        { id: "s11", targetKg: 60, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s12", targetKg: 60, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s13", targetKg: 60, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
      ]
    },
    {
      id: "ex5",
      name: "Seated Cable Row",
      coachNotes: "Petto in fuori, porta i gomiti indietro. Non oscillare con il busto.",
      sets: [
        { id: "s14", targetKg: 55, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s15", targetKg: 55, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
        { id: "s16", targetKg: 55, targetReps: 10, actualKg: "", actualReps: "", rpe: "", completed: false },
      ]
    },
    {
      id: "cooldown",
      name: "Cool-down: Stretching",
      coachNotes: "30 secondi per ogni stretch. Pettorali, dorsali, spalle.",
      sets: [
        { id: "c1", targetKg: 0, targetReps: 1, actualKg: "", actualReps: "", rpe: "", completed: false },
      ]
    },
  ] as ExerciseData[]
};

export default function WorkoutPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Workout state
  const [exercises, setExercises] = useState<ExerciseData[]>(mockWorkout.exercises);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  
  // Timer state
  const [workoutStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(true);
  
  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(90);
  const [defaultRestTime, setDefaultRestTime] = useState(90);

  // Workout elapsed timer
  useEffect(() => {
    if (!isWorkoutActive) return;
    
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStartTime]);

  // Rest timer countdown
  useEffect(() => {
    if (!restTimerActive || restTimeRemaining <= 0) {
      if (restTimeRemaining <= 0) {
        setRestTimerActive(false);
      }
      return;
    }

    const interval = setInterval(() => {
      setRestTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimerActive, restTimeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetUpdate = useCallback((exerciseId: string, setId: string, field: keyof SetData, value: string | boolean) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id !== exerciseId) return exercise;
      return {
        ...exercise,
        sets: exercise.sets.map(set => {
          if (set.id !== setId) return set;
          return { ...set, [field]: value };
        })
      };
    }));
  }, []);

  const handleSetComplete = useCallback((exerciseId: string, setId: string, completed: boolean) => {
    handleSetUpdate(exerciseId, setId, 'completed', completed);
    
    // Auto-start rest timer when completing a set
    if (completed) {
      setRestTimeRemaining(defaultRestTime);
      setRestTimerActive(true);
    }
  }, [handleSetUpdate, defaultRestTime]);

  const toggleNotes = (exerciseId: string) => {
    setExpandedNotes(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const getTotalSets = () => exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const getCompletedSets = () => exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const progressPercent = (getCompletedSets() / getTotalSets()) * 100;

  const handleFinishWorkout = () => {
    setIsWorkoutActive(false);
    // In a real app, save workout data here
    navigate('/athlete');
  };

  const skipRest = () => {
    setRestTimerActive(false);
    setRestTimeRemaining(defaultRestTime);
  };

  const addRestTime = (seconds: number) => {
    setRestTimeRemaining(prev => prev + seconds);
  };

  return (
    <AthleteLayout>
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold truncate">{mockWorkout.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span className="tabular-nums">{formatTime(elapsedSeconds)}</span>
                </div>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {getCompletedSets()}/{getTotalSets()} sets
                </span>
              </div>
            </div>
            <Button 
              onClick={handleFinishWorkout}
              size="sm"
              className="gradient-primary h-8 px-3 text-xs font-semibold"
            >
              <Flag className="h-3.5 w-3.5 mr-1" />
              Termina
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Exercise List */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="px-4 py-4 space-y-4">
          {exercises.map((exercise, exerciseIndex) => (
            <Card key={exercise.id} className="border-0 overflow-hidden">
              <CardContent className="p-0">
                {/* Exercise Header */}
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Esercizio {exerciseIndex + 1}
                      </span>
                      <h3 className="font-semibold text-sm">{exercise.name}</h3>
                    </div>
                  </div>
                  
                  {/* Video Placeholder */}
                  <div className="mt-3 aspect-video bg-secondary/50 rounded-lg flex items-center justify-center">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  
                  {/* Coach Notes (Collapsible) */}
                  {exercise.coachNotes && (
                    <Collapsible 
                      open={expandedNotes[exercise.id]} 
                      onOpenChange={() => toggleNotes(exercise.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-3 h-8 text-xs text-muted-foreground justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3" />
                            Note del Coach
                          </span>
                          {expandedNotes[exercise.id] ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {exercise.coachNotes}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
                
                {/* Sets Table */}
                <div className="p-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-2 mb-2 px-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Set</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Kg</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Reps</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">RPE</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">✓</span>
                  </div>
                  
                  {/* Sets Rows */}
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div 
                        key={set.id}
                        className={cn(
                          "grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-lg transition-colors",
                          set.completed ? "bg-success/10" : "bg-secondary/30"
                        )}
                      >
                        <span className="text-xs font-medium text-center tabular-nums text-muted-foreground">
                          {setIndex + 1}
                        </span>
                        
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder={set.targetKg > 0 ? set.targetKg.toString() : "-"}
                          value={set.actualKg}
                          onChange={(e) => handleSetUpdate(exercise.id, set.id, 'actualKg', e.target.value)}
                          className="h-8 text-xs text-center tabular-nums bg-background border-border/50"
                          disabled={set.completed}
                        />
                        
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder={set.targetReps.toString()}
                          value={set.actualReps}
                          onChange={(e) => handleSetUpdate(exercise.id, set.id, 'actualReps', e.target.value)}
                          className="h-8 text-xs text-center tabular-nums bg-background border-border/50"
                          disabled={set.completed}
                        />
                        
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="RPE"
                          value={set.rpe}
                          onChange={(e) => handleSetUpdate(exercise.id, set.id, 'rpe', e.target.value)}
                          className="h-8 text-xs text-center tabular-nums bg-background border-border/50"
                          disabled={set.completed}
                        />
                        
                        <div className="flex justify-center">
                          <Checkbox
                            checked={set.completed}
                            onCheckedChange={(checked) => handleSetComplete(exercise.id, set.id, !!checked)}
                            className={cn(
                              "h-6 w-6 rounded-full border-2",
                              set.completed && "bg-success border-success data-[state=checked]:bg-success"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Bottom spacer for rest timer */}
          <div className="h-24" />
        </div>
      </ScrollArea>

      {/* Floating Rest Timer */}
      {restTimerActive && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in">
          <Card className="border-0 glass overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center",
                    restTimeRemaining <= 10 ? "bg-warning/20" : "bg-primary/20"
                  )}>
                    <Timer className={cn(
                      "h-6 w-6",
                      restTimeRemaining <= 10 ? "text-warning" : "text-primary"
                    )} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pausa</p>
                    <p className={cn(
                      "text-2xl font-bold tabular-nums",
                      restTimeRemaining <= 10 ? "text-warning" : "text-foreground"
                    )}>
                      {formatTime(restTimeRemaining)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => addRestTime(30)}
                  >
                    <span className="text-xs font-medium">+30s</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setRestTimeRemaining(defaultRestTime)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground"
                    onClick={skipRest}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AthleteLayout>
  );
}
