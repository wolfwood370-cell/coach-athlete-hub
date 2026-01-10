import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Flag,
  Trophy,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Foster RPE Scale configuration
const fosterRpeScale = [
  { value: 1, label: "Riposo", color: "bg-success" },
  { value: 2, label: "Molto Facile", color: "bg-success" },
  { value: 3, label: "Facile", color: "bg-success/80" },
  { value: 4, label: "Moderato", color: "bg-warning/80" },
  { value: 5, label: "Abbastanza Duro", color: "bg-warning" },
  { value: 6, label: "Duro", color: "bg-orange-400" },
  { value: 7, label: "Molto Duro", color: "bg-orange-500" },
  { value: 8, label: "Molto Duro+", color: "bg-orange-600" },
  { value: 9, label: "Quasi Max", color: "bg-destructive/80" },
  { value: 10, label: "Massimale", color: "bg-destructive" },
];

const getRpeColor = (rpe: number): string => {
  if (rpe <= 3) return "bg-success";
  if (rpe <= 5) return "bg-warning";
  if (rpe <= 8) return "bg-orange-500";
  return "bg-destructive";
};

const getRpeTextColor = (rpe: number): string => {
  if (rpe <= 3) return "text-success";
  if (rpe <= 5) return "text-warning";
  if (rpe <= 8) return "text-orange-500";
  return "text-destructive";
};

export default function WorkoutPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  
  // Session recap dialog state
  const [showRecapDialog, setShowRecapDialog] = useState(false);
  const [recapDurationHours, setRecapDurationHours] = useState(0);
  const [recapDurationMinutes, setRecapDurationMinutes] = useState(0);
  const [sessionRpe, setSessionRpe] = useState(5);

  // Helper to check if a string is a valid UUID
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

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

  // Mutation to save workout log
  const saveWorkoutMutation = useMutation({
    mutationFn: async (data: { 
      durationSeconds: number; 
      rpe: number; 
      exercisesData: ExerciseData[];
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("User not authenticated");
      
      const durationMinutes = Math.round(data.durationSeconds / 60);
      const sessionLoad = durationMinutes * data.rpe;
      
      const { error } = await supabase.from("workout_logs").insert({
        athlete_id: userData.user.id,
        workout_id: id || crypto.randomUUID(), // Use actual workout ID or generate one
        duration_seconds: data.durationSeconds,
        rpe_global: data.rpe,
        exercises_data: JSON.parse(JSON.stringify(data.exercisesData)), // Convert to JSON-safe format
        started_at: workoutStartTime.toISOString(),
        completed_at: new Date().toISOString(),
      } as any);
      
      if (error) throw error;
      return { sessionLoad };
    },
    onSuccess: (result) => {
      toast({
        title: "Allenamento salvato!",
        description: `Carico: ${result.sessionLoad} UA`,
      });
      navigate("/athlete");
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare l'allenamento. Riprova.",
        variant: "destructive",
      });
      console.error("Save workout error:", error);
    },
  });

  const handleFinishWorkout = () => {
    setIsWorkoutActive(false);
    // Convert elapsed time to hours and minutes for the recap form
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    setRecapDurationHours(hours);
    setRecapDurationMinutes(minutes);
    setShowRecapDialog(true);
  };

  const handleSaveWorkoutLog = () => {
    // Calculate total minutes and session load
    const totalMinutes = (recapDurationHours * 60) + recapDurationMinutes;
    const totalSeconds = totalMinutes * 60;
    const sessionLoad = totalMinutes * sessionRpe;

    // Check if workout ID is a valid UUID
    if (!id || !isValidUUID(id)) {
      // Mock mode - simulate success without saving to database
      toast({
        title: "Allenamento salvato!",
        description: `Carico: ${sessionLoad} UA (Mock Mode)`,
      });
      navigate("/athlete");
      return;
    }

    // Real save to database
    saveWorkoutMutation.mutate({
      durationSeconds: totalSeconds,
      rpe: sessionRpe,
      exercisesData: exercises,
    });
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

      {/* Session Recap Dialog */}
      <Dialog open={showRecapDialog} onOpenChange={setShowRecapDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Allenamento Completato!
            </DialogTitle>
            <DialogDescription>
              Completa il recap della sessione per salvare i dati.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Duration Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durata Reale</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={recapDurationHours}
                      onChange={(e) => setRecapDurationHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="text-center text-lg tabular-nums pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ore</span>
                  </div>
                </div>
                <span className="text-lg font-bold">:</span>
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={recapDurationMinutes}
                      onChange={(e) => setRecapDurationMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="text-center text-lg tabular-nums pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Puoi modificare la durata se il timer è rimasto acceso troppo a lungo.
              </p>
            </div>

            {/* RPE Scale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Intensità Percepita (RPE)</label>
                <span className={cn("text-lg font-bold tabular-nums", getRpeTextColor(sessionRpe))}>
                  {sessionRpe}
                </span>
              </div>
              
              {/* RPE Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {fosterRpeScale.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSessionRpe(item.value)}
                    className={cn(
                      "h-10 rounded-lg font-semibold text-sm transition-all",
                      sessionRpe === item.value
                        ? `${item.color} text-white ring-2 ring-offset-2 ring-offset-background ring-primary scale-105`
                        : "bg-secondary hover:bg-secondary/80 text-foreground"
                    )}
                  >
                    {item.value}
                  </button>
                ))}
              </div>
              
              {/* Current RPE Label */}
              <div className={cn(
                "text-center py-2 rounded-lg text-sm font-medium",
                getRpeColor(sessionRpe),
                "text-white"
              )}>
                {fosterRpeScale.find(r => r.value === sessionRpe)?.label}
              </div>
              
              {/* RPE Legend */}
              <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span>1-3 Facile</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span>4-5 Moderato</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span>6-8 Intenso</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span>9-10 Max</span>
                </div>
              </div>
            </div>

            {/* Session Load Preview */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Carico Sessione (sRPE)</span>
                  <span className="text-[10px] text-muted-foreground/70">Unità Arbitrarie (UA)</span>
                </div>
                <span className="text-xl font-bold tabular-nums">
                  {((recapDurationHours * 60) + recapDurationMinutes) * sessionRpe} UA
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                (Ore × 60 + Minuti) × RPE = UA
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowRecapDialog(false);
                setIsWorkoutActive(true);
              }}
            >
              Continua Workout
            </Button>
            <Button
              className="flex-1 gradient-primary"
              onClick={handleSaveWorkoutLog}
              disabled={saveWorkoutMutation.isPending}
            >
              {saveWorkoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva Log"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AthleteLayout>
  );
}
