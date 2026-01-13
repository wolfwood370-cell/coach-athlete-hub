import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Timer,
  X,
  Plus,
  Minus,
  RotateCcw,
  Dumbbell,
  MessageSquare,
  Flag,
  Trophy,
  Loader2,
  Zap,
  TrendingUp,
  Clock,
  Flame,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync, type WorkoutLogInput, type SetData as OfflineSetData } from "@/hooks/useOfflineSync";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useWorkoutStreak } from "@/hooks/useWorkoutStreak";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import { triggerConfetti, triggerPRConfetti } from "@/utils/ux";

// Types
interface SetData {
  id: string;
  setNumber: number;
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
  restSeconds: number;
  supersetGroup?: string;
  sets: SetData[];
}

// Foster RPE Scale - Session Level
const fosterRpeScale = [
  { value: 1, label: "Riposo", description: "Recupero attivo", color: "bg-emerald-500" },
  { value: 2, label: "Molto Facile", description: "Sforzo minimo", color: "bg-emerald-400" },
  { value: 3, label: "Facile", description: "Riscaldamento", color: "bg-green-400" },
  { value: 4, label: "Moderato", description: "Lavoro leggero", color: "bg-lime-400" },
  { value: 5, label: "Abbastanza Duro", description: "Impegnativo", color: "bg-yellow-400" },
  { value: 6, label: "Duro", description: "Faticoso", color: "bg-amber-400" },
  { value: 7, label: "Molto Duro", description: "Molto faticoso", color: "bg-orange-400" },
  { value: 8, label: "Molto Duro+", description: "Al limite", color: "bg-orange-500" },
  { value: 9, label: "Quasi Max", description: "Massimale submx", color: "bg-red-400" },
  { value: 10, label: "Massimale", description: "Sforzo totale", color: "bg-red-500" },
];

const getRpeColor = (rpe: number): string => {
  if (rpe <= 3) return "text-emerald-500";
  if (rpe <= 5) return "text-yellow-500";
  if (rpe <= 7) return "text-orange-500";
  return "text-red-500";
};

const getRpeBgColor = (rpe: number): string => {
  if (rpe <= 3) return "bg-emerald-500";
  if (rpe <= 5) return "bg-yellow-500";
  if (rpe <= 7) return "bg-orange-500";
  return "bg-red-500";
};

// Parse workout structure from database
function parseWorkoutStructure(structure: any[]): ExerciseData[] {
  return structure.map((ex, index) => ({
    id: ex.id || `ex-${index}`,
    name: ex.name,
    videoUrl: ex.videoUrl,
    coachNotes: ex.notes || ex.coachNotes,
    restSeconds: ex.restSeconds || 90,
    supersetGroup: ex.supersetGroup,
    sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
      id: `${ex.id || index}-set-${i}`,
      setNumber: i + 1,
      targetKg: parseFloat(ex.load?.replace(/[^0-9.]/g, '') || '0') || 0,
      targetReps: parseInt(ex.reps) || 8,
      actualKg: "",
      actualReps: "",
      rpe: "",
      completed: false,
    })),
  }));
}

// Mock data for development
const mockWorkout = {
  id: "mock-1",
  title: "Upper Body Hypertrophy",
  estimatedDuration: 45,
  structure: [
    {
      id: "ex1",
      name: "Bench Press",
      sets: 4,
      reps: "8",
      load: "80kg",
      notes: "Controllare la discesa (3 secondi). Focus sulla connessione mente-muscolo.",
      restSeconds: 120,
    },
    {
      id: "ex2",
      name: "Incline Dumbbell Press",
      sets: 3,
      reps: "10",
      load: "30kg",
      notes: "Angolo 30-45 gradi. Stretch in basso.",
      restSeconds: 90,
      supersetGroup: "ss1",
    },
    {
      id: "ex3",
      name: "Cable Flyes",
      sets: 3,
      reps: "12",
      load: "15kg",
      notes: "Squeeze al centro per 1 secondo.",
      restSeconds: 60,
      supersetGroup: "ss1",
    },
    {
      id: "ex4",
      name: "Lat Pulldown",
      sets: 4,
      reps: "10",
      load: "60kg",
      notes: "Tira verso il petto. Controlla la fase eccentrica.",
      restSeconds: 90,
    },
    {
      id: "ex5",
      name: "Seated Cable Row",
      sets: 3,
      reps: "10",
      load: "55kg",
      notes: "Petto in fuori, porta i gomiti indietro.",
      restSeconds: 90,
    },
  ],
};

export default function WorkoutPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logWorkout, isLogging, isOnline } = useOfflineSync();
  const haptic = useHapticFeedback();
  const { checkForPR, showPRToast } = usePersonalRecords();
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Workout state
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Timer state
  const [workoutStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(true);
  
  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(90);
  const [currentRestDuration, setCurrentRestDuration] = useState(90);
  
  // Session recap dialog state
  const [showRecapDialog, setShowRecapDialog] = useState(false);
  const [sessionRpe, setSessionRpe] = useState(5);
  const [workoutNotes, setWorkoutNotes] = useState("");
  
  // Auto-regulation state
  const [showAutoRegDialog, setShowAutoRegDialog] = useState(false);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Fetch current user ID and check readiness
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        
        // Fetch today's readiness score
        const today = new Date().toISOString().split('T')[0];
        const { data: readinessData } = await supabase
          .from('daily_readiness')
          .select('score')
          .eq('athlete_id', data.user.id)
          .eq('date', today)
          .maybeSingle();
        
        if (readinessData?.score !== null && readinessData?.score !== undefined) {
          setReadinessScore(readinessData.score);
          // Show dialog if readiness is below 45%
          if (readinessData.score < 45) {
            setShowAutoRegDialog(true);
          }
        }
      }
    });
  }, []);

  // Get workout streak
  const { currentStreak, isStreakDay } = useWorkoutStreak(currentUserId || undefined);
  
  // Apply auto-regulation: remove 1 set from each exercise (~20% reduction)
  const applyAutoRegulation = useCallback(() => {
    setExercises(prev => prev.map(exercise => ({
      ...exercise,
      sets: exercise.sets.length > 1 
        ? exercise.sets.slice(0, -1) // Remove the last set
        : exercise.sets
    })));
    setIsRecoveryMode(true);
    setShowAutoRegDialog(false);
    toast({
      title: "📉 Recovery Mode attivato",
      description: "Volume ridotto del 20% per favorire il recupero.",
    });
  }, [toast]);
  
  const ignoreAutoReg = useCallback(() => {
    setShowAutoRegDialog(false);
    toast({
      title: "Procedi con cautela",
      description: "Ascolta il tuo corpo durante l'allenamento.",
      variant: "destructive",
    });
  }, [toast]);

  // Fetch workout from database
  const { data: workoutData, isLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      if (!id || id === "mock" || id.startsWith("mock-")) {
        return mockWorkout;
      }
      
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Initialize exercises from workout data
  useEffect(() => {
    if (workoutData?.structure) {
      const parsed = parseWorkoutStructure(workoutData.structure as any[]);
      setExercises(parsed);
    }
  }, [workoutData]);

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
      if (restTimeRemaining <= 0 && restTimerActive) {
        // Vibrate with haptic feedback when timer ends
        haptic.warning();
        setRestTimerActive(false);
      }
      return;
    }

    const interval = setInterval(() => {
      setRestTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimerActive, restTimeRemaining, haptic]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const getTotalSets = () => exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const getCompletedSets = () => exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const progressPercent = getTotalSets() > 0 ? (getCompletedSets() / getTotalSets()) * 100 : 0;

  // Handlers
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

  const handleSetComplete = useCallback(async (exerciseId: string, setId: string, completed: boolean) => {
    handleSetUpdate(exerciseId, setId, 'completed', completed);
    
    if (completed) {
      // Trigger haptic feedback
      haptic.medium();
      
      // Get rest time from exercise
      const exercise = exercises.find(ex => ex.id === exerciseId);
      const restTime = exercise?.restSeconds || 90;
      
      // Check for PR
      const set = exercise?.sets.find(s => s.id === setId);
      if (set && currentUserId && exercise) {
        const weight = parseFloat(set.actualKg) || set.targetKg;
        const reps = parseInt(set.actualReps) || set.targetReps;
        
        if (weight > 0) {
          const prResult = await checkForPR(currentUserId, exercise.name, weight, reps);
          if (prResult.isPR) {
            triggerPRConfetti();
            showPRToast(exercise.name, weight, prResult.improvement);
          }
        }
      }
      
      // Check if in superset
      if (exercise?.supersetGroup) {
        const supersetExercises = exercises.filter(ex => ex.supersetGroup === exercise.supersetGroup);
        const currentIndex = supersetExercises.findIndex(ex => ex.id === exerciseId);
        const isLastInSuperset = currentIndex === supersetExercises.length - 1;
        
        if (!isLastInSuperset) {
          // Shorter rest between superset exercises
          setCurrentRestDuration(30);
          setRestTimeRemaining(30);
        } else {
          setCurrentRestDuration(restTime);
          setRestTimeRemaining(restTime);
        }
      } else {
        setCurrentRestDuration(restTime);
        setRestTimeRemaining(restTime);
      }
      
      setRestTimerActive(true);
    }
  }, [exercises, handleSetUpdate, haptic, currentUserId, checkForPR, showPRToast]);

  const toggleNotes = (exerciseId: string) => {
    setExpandedNotes(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const handleFinishWorkout = () => {
    setIsWorkoutActive(false);
    setRestTimerActive(false);
    
    // Trigger celebration with confetti
    triggerConfetti();
    haptic.success();
    setShowCelebration(true);
    
    // Show recap dialog after a brief delay for celebration effect
    setTimeout(() => {
      setShowRecapDialog(true);
    }, 500);
  };

  const handleSaveWorkoutLog = async () => {
    const durationMinutes = Math.round(elapsedSeconds / 60);
    const sessionLoad = durationMinutes * sessionRpe;
    
    // Prepare data for offline sync
    const workoutLogInput: WorkoutLogInput = {
      local_id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workout_id: id || "mock",
      athlete_id: "", // Will be set by the hook
      started_at: workoutStartTime.toISOString(),
      completed_at: new Date().toISOString(),
      srpe: sessionRpe,
      duration_minutes: durationMinutes,
      notes: workoutNotes,
      exercises: exercises.map((ex, index) => ({
        exercise_name: ex.name,
        exercise_order: index,
        sets_data: ex.sets.map(set => ({
          set_number: set.setNumber,
          reps: parseInt(set.actualReps) || set.targetReps,
          weight_kg: parseFloat(set.actualKg) || set.targetKg,
          rpe: parseInt(set.rpe) || undefined,
          completed: set.completed,
        })),
        notes: ex.coachNotes,
      })),
    };

    // Get user ID
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      workoutLogInput.athlete_id = userData.user.id;
    }

    // Log workout (works offline too)
    logWorkout(workoutLogInput, {
      onSuccess: () => {
        toast({
          title: "Allenamento salvato!",
          description: `Carico sessione: ${sessionLoad} UA`,
        });
        navigate("/athlete");
      },
    });
  };

  // Rest timer controls
  const skipRest = () => {
    setRestTimerActive(false);
    setRestTimeRemaining(currentRestDuration);
  };

  const addRestTime = (seconds: number) => {
    setRestTimeRemaining(prev => Math.max(0, prev + seconds));
  };

  const resetRestTimer = () => {
    setRestTimeRemaining(currentRestDuration);
  };

  // Loading state
  if (isLoading) {
    return (
      <AthleteLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AthleteLayout>
    );
  }

  // Calculate Foster Load for recap
  const durationMinutes = Math.round(elapsedSeconds / 60);
  const sessionLoad = durationMinutes * sessionRpe;
  const rpeInfo = fosterRpeScale.find(r => r.value === sessionRpe);

  return (
    <AthleteLayout>
      {/* Auto-Regulation Dialog */}
      <Dialog open={showAutoRegDialog} onOpenChange={setShowAutoRegDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Low Readiness Detected ({readinessScore}%)
            </DialogTitle>
            <DialogDescription className="pt-2">
              I tuoi indicatori di recupero sono bassi oggi. Il tuo Coach raccomanda di ridurre il volume per proteggere la tua salute.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Readiness indicator */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-amber-500" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Readiness Score</span>
                    <span className="text-lg font-bold text-amber-600">{readinessScore}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all"
                      style={{ width: `${readinessScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              L'Auto-Regolazione riduce ~1 set per esercizio mantenendo l'intensità.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={applyAutoRegulation}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Applica Auto-Reg (-20% Set)
            </Button>
            <Button 
              variant="outline" 
              onClick={ignoreAutoReg}
              className="w-full"
            >
              Mi sento bene (Ignora)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 glass-adaptive border-b border-border/30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold truncate">
                  {workoutData?.title || mockWorkout.title}
                </h1>
                {isRecoveryMode && (
                  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] h-5">
                    📉 Recovery Mode
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span className="tabular-nums font-medium">{formatTime(elapsedSeconds)}</span>
                </div>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {getCompletedSets()}/{getTotalSets()} sets
                </span>
                {!isOnline && (
                  <Badge variant="secondary" className="text-[9px] h-4">
                    Offline
                  </Badge>
                )}
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
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Exercise List */}
      <ScrollArea className="h-[calc(100vh-180px)]" ref={scrollRef}>
        <div className="px-4 py-4 space-y-4 pb-32">
          {exercises.map((exercise, exerciseIndex) => {
            const isSuperset = !!exercise.supersetGroup;
            const supersetExercises = isSuperset 
              ? exercises.filter(ex => ex.supersetGroup === exercise.supersetGroup)
              : [];
            const supersetIndex = supersetExercises.findIndex(ex => ex.id === exercise.id);
            const isFirstInSuperset = supersetIndex === 0;
            const isLastInSuperset = supersetIndex === supersetExercises.length - 1;
            
            return (
              <Card 
                key={exercise.id} 
                className={cn(
                  "border-0 overflow-hidden",
                  isSuperset && "border-l-4 border-l-primary"
                )}
              >
                <CardContent className="p-0">
                  {/* Superset indicator */}
                  {isSuperset && isFirstInSuperset && (
                    <div className="px-4 py-1.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        Superset ({supersetExercises.length} esercizi)
                      </span>
                    </div>
                  )}
                  
                  {/* Exercise Header */}
                  <div className="p-4 border-b border-border/30">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {isSuperset ? `${supersetIndex + 1}/${supersetExercises.length}` : `Esercizio ${exerciseIndex + 1}`}
                        </span>
                        <h3 className="font-semibold text-sm">{exercise.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {exercise.sets.length} × {exercise.sets[0]?.targetReps || 8}
                          </Badge>
                          {exercise.sets[0]?.targetKg > 0 && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              {exercise.sets[0].targetKg}kg
                            </Badge>
                          )}
                        </div>
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
                    <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-2 mb-2 px-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Set</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Kg</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Reps</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">RPE</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">✓</span>
                    </div>
                    
                    {/* Sets Rows */}
                    <div className="space-y-2">
                      {exercise.sets.map((set) => (
                        <div 
                          key={set.id}
                          className={cn(
                            "grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-lg transition-colors",
                            set.completed ? "bg-success/10" : "bg-secondary/30"
                          )}
                        >
                          {/* Set Number */}
                          <div className="text-center">
                            <span className={cn(
                              "text-sm font-bold",
                              set.completed ? "text-success" : "text-muted-foreground"
                            )}>
                              {set.setNumber}
                            </span>
                            <p className="text-[9px] text-muted-foreground">
                              {set.targetKg > 0 ? `${set.targetKg}kg` : '—'}
                            </p>
                          </div>
                          
                          {/* Actual KG */}
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder={set.targetKg > 0 ? set.targetKg.toString() : "kg"}
                            value={set.actualKg}
                            onChange={(e) => handleSetUpdate(exercise.id, set.id, 'actualKg', e.target.value)}
                            className={cn(
                              "h-9 text-center text-sm font-medium",
                              set.completed && "border-success/30 bg-success/5"
                            )}
                          />
                          
                          {/* Actual Reps */}
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder={set.targetReps.toString()}
                            value={set.actualReps}
                            onChange={(e) => handleSetUpdate(exercise.id, set.id, 'actualReps', e.target.value)}
                            className={cn(
                              "h-9 text-center text-sm font-medium",
                              set.completed && "border-success/30 bg-success/5"
                            )}
                          />
                          
                          {/* RPE */}
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={10}
                            placeholder="RPE"
                            value={set.rpe}
                            onChange={(e) => handleSetUpdate(exercise.id, set.id, 'rpe', e.target.value)}
                            className={cn(
                              "h-9 text-center text-sm font-medium",
                              set.completed && "border-success/30 bg-success/5",
                              set.rpe && getRpeColor(parseInt(set.rpe))
                            )}
                          />
                          
                          {/* Complete Checkbox */}
                          <div className="flex justify-center">
                            <Checkbox
                              checked={set.completed}
                              onCheckedChange={(checked) => 
                                handleSetComplete(exercise.id, set.id, checked as boolean)
                              }
                              className={cn(
                                "h-6 w-6 rounded-full",
                                set.completed && "border-success bg-success text-success-foreground"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Floating Rest Timer */}
      {restTimerActive && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <div className="glass rounded-2xl p-4 shadow-xl border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Recupero</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={skipRest}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Timer Display */}
            <div className="text-center mb-4">
              <span className={cn(
                "text-5xl font-bold tabular-nums transition-colors",
                restTimeRemaining <= 10 ? "text-destructive animate-pulse" : "text-foreground"
              )}>
                {formatTime(restTimeRemaining)}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-linear",
                  restTimeRemaining <= 10 ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${(restTimeRemaining / currentRestDuration) * 100}%` }}
              />
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => addRestTime(-15)}
              >
                <Minus className="h-3 w-3 mr-1" />
                15s
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={resetRestTimer}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => addRestTime(15)}
              >
                <Plus className="h-3 w-3 mr-1" />
                15s
              </Button>
              <Button
                size="sm"
                className="h-9 ml-2"
                onClick={skipRest}
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Recap Dialog */}
      <Dialog open={showRecapDialog} onOpenChange={setShowRecapDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Sessione Completata!
            </DialogTitle>
            <DialogDescription>
              Come è andato l'allenamento?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Streak Banner */}
            {currentStreak > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                <div className="relative">
                  <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {currentStreak}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-orange-600 dark:text-orange-400">
                    🔥 {currentStreak} giorni consecutivi!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stai costruendo un'abitudine solida!
                  </p>
                </div>
              </div>
            )}
            
            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-secondary">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold tabular-nums">{durationMinutes}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Minuti</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary">
                <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-success" />
                <p className="text-lg font-bold tabular-nums">{getCompletedSets()}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Set</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold tabular-nums">{sessionLoad}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Carico UA</p>
              </div>
            </div>

            {/* Foster RPE Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Quanto è stato duro? (sRPE)
              </label>
              
              <div className="flex items-center gap-4">
                <span className={cn("text-4xl font-bold", getRpeColor(sessionRpe))}>
                  {sessionRpe}
                </span>
                <div className="flex-1">
                  <Slider
                    value={[sessionRpe]}
                    onValueChange={([value]) => setSessionRpe(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {rpeInfo && (
                <div className={cn("p-3 rounded-lg", rpeInfo.color, "text-white")}>
                  <p className="font-semibold">{rpeInfo.label}</p>
                  <p className="text-sm opacity-90">{rpeInfo.description}</p>
                </div>
              )}
            </div>

            {/* Foster Load Display */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Carico Sessione</p>
                  <p className="text-3xl font-bold text-primary">{sessionLoad} <span className="text-sm font-normal">UA</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Formula Foster</p>
                  <p className="text-sm font-mono">{durationMinutes} min × RPE {sessionRpe}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Input
                placeholder="Come ti sei sentito? Qualcosa da segnalare?"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRecapDialog(false)}
            >
              Modifica
            </Button>
            <Button
              className="flex-1 gradient-primary"
              onClick={handleSaveWorkoutLog}
              disabled={isLogging}
            >
              {isLogging ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Salva
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AthleteLayout>
  );
}
