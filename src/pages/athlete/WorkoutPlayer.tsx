import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  MessageSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock workout data
const mockWorkout = {
  id: "1",
  name: "Upper Body Hypertrophy",
  duration: "45 min",
  exercises: [
    {
      id: "ex1",
      name: "Bench Press",
      videoPlaceholder: true,
      coachNotes: "Mantieni la schiena ben aderente alla panca. Controlla la discesa in 2-3 secondi e spingi in modo esplosivo.",
      sets: [
        { id: "s1", targetReps: 10, targetKg: 60, rpe: 7 },
        { id: "s2", targetReps: 10, targetKg: 60, rpe: 8 },
        { id: "s3", targetReps: 8, targetKg: 65, rpe: 9 },
      ],
    },
    {
      id: "ex2",
      name: "Incline Dumbbell Press",
      videoPlaceholder: true,
      coachNotes: "Inclina la panca a 30-45 gradi. Focus sulla contrazione del petto alto.",
      sets: [
        { id: "s1", targetReps: 12, targetKg: 22, rpe: 7 },
        { id: "s2", targetReps: 12, targetKg: 22, rpe: 8 },
        { id: "s3", targetReps: 10, targetKg: 24, rpe: 9 },
      ],
    },
    {
      id: "ex3",
      name: "Lat Pulldown",
      videoPlaceholder: true,
      coachNotes: "Tira verso lo sterno, non verso il collo. Squeeze alla fine del movimento.",
      sets: [
        { id: "s1", targetReps: 12, targetKg: 50, rpe: 7 },
        { id: "s2", targetReps: 12, targetKg: 50, rpe: 8 },
        { id: "s3", targetReps: 10, targetKg: 55, rpe: 9 },
      ],
    },
    {
      id: "ex4",
      name: "Seated Cable Row",
      videoPlaceholder: true,
      coachNotes: "Mantieni il petto alto e le spalle indietro. Non oscillare con il busto.",
      sets: [
        { id: "s1", targetReps: 12, targetKg: 45, rpe: 7 },
        { id: "s2", targetReps: 12, targetKg: 45, rpe: 8 },
        { id: "s3", targetReps: 10, targetKg: 50, rpe: 9 },
      ],
    },
    {
      id: "ex5",
      name: "Lateral Raises",
      videoPlaceholder: true,
      coachNotes: "Movimento controllato, non oscillare. Ferma appena sopra parallelo.",
      sets: [
        { id: "s1", targetReps: 15, targetKg: 8, rpe: 7 },
        { id: "s2", targetReps: 15, targetKg: 8, rpe: 8 },
        { id: "s3", targetReps: 12, targetKg: 10, rpe: 9 },
      ],
    },
    {
      id: "ex6",
      name: "Tricep Pushdown",
      videoPlaceholder: true,
      coachNotes: "Gomiti fermi ai fianchi. Full extension in basso, squeeze.",
      sets: [
        { id: "s1", targetReps: 15, targetKg: 25, rpe: 7 },
        { id: "s2", targetReps: 15, targetKg: 25, rpe: 8 },
        { id: "s3", targetReps: 12, targetKg: 30, rpe: 9 },
      ],
    },
  ],
};

interface SetData {
  kg: string;
  reps: string;
  rpe: string;
  done: boolean;
}

interface ExerciseSetState {
  [exerciseId: string]: {
    [setIndex: number]: SetData;
  };
}

export default function WorkoutPlayer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [workout] = useState(mockWorkout);
  const [setStates, setSetStates] = useState<ExerciseSetState>({});
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [defaultRestTime, setDefaultRestTime] = useState(90);
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Total workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Rest timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (restTimer === 0) {
      // Timer finished - could add vibration/sound here
      setShowRestTimer(false);
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSetChange = useCallback(
    (exerciseId: string, setIndex: number, field: keyof SetData, value: string | boolean) => {
      setSetStates((prev) => ({
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          [setIndex]: {
            ...prev[exerciseId]?.[setIndex],
            [field]: value,
          },
        },
      }));

      // Auto-start rest timer when marking a set as done
      if (field === "done" && value === true) {
        setRestTimer(defaultRestTime);
        setShowRestTimer(true);
      }
    },
    [defaultRestTime]
  );

  const getSetData = (exerciseId: string, setIndex: number, originalSet: typeof mockWorkout.exercises[0]["sets"][0]) => {
    const stateData = setStates[exerciseId]?.[setIndex];
    return {
      kg: stateData?.kg ?? originalSet.targetKg.toString(),
      reps: stateData?.reps ?? originalSet.targetReps.toString(),
      rpe: stateData?.rpe ?? originalSet.rpe.toString(),
      done: stateData?.done ?? false,
    };
  };

  const getTotalSets = () => {
    return workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  };

  const getCompletedSets = () => {
    let completed = 0;
    Object.values(setStates).forEach((exercise) => {
      Object.values(exercise).forEach((set) => {
        if (set.done) completed++;
      });
    });
    return completed;
  };

  const handleFinishWorkout = () => {
    setIsTimerRunning(false);
    // Could save workout data here
    navigate("/athlete");
  };

  const dismissRestTimer = () => {
    setShowRestTimer(false);
    setRestTimer(null);
  };

  const adjustRestTime = (delta: number) => {
    setDefaultRestTime((prev) => Math.max(30, prev + delta));
    if (restTimer !== null) {
      setRestTimer((prev) => (prev !== null ? Math.max(0, prev + delta) : null));
    }
  };

  return (
    <AthleteLayout hideBottomNav>
      <div className="min-h-screen flex flex-col pb-4">
        {/* ===== STICKY HEADER ===== */}
        <div className="sticky top-0 z-40 glass border-b border-border/20">
          <div className="p-4 safe-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => navigate("/athlete")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-sm font-semibold line-clamp-1">{workout.name}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="tabular-nums">{formatTime(workoutTimer)}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{getCompletedSets()}/{getTotalSets()} sets</span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="h-9 px-4 font-semibold gradient-primary"
                onClick={handleFinishWorkout}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Finish
              </Button>
            </div>
          </div>
        </div>

        {/* ===== EXERCISE LIST ===== */}
        <div className="flex-1 p-4 space-y-4">
          {workout.exercises.map((exercise, exIndex) => (
            <Card key={exercise.id} className="border-0 overflow-hidden">
              <CardContent className="p-0">
                {/* Exercise Header */}
                <div className="p-4 border-b border-border/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                        {exIndex + 1}
                      </div>
                      <h3 className="font-semibold text-sm">{exercise.name}</h3>
                    </div>
                  </div>
                  
                  {/* Video Placeholder */}
                  <div className="mt-3 aspect-video rounded-lg bg-secondary/50 flex items-center justify-center">
                    <Play className="h-8 w-8 text-muted-foreground/50" />
                  </div>

                  {/* Coach Notes (Collapsible) */}
                  {exercise.coachNotes && (
                    <Collapsible className="mt-3">
                      <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Note del coach</span>
                        <ChevronDown className="h-3.5 w-3.5 ml-auto transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                          {exercise.coachNotes}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>

                {/* Sets Table */}
                <div className="p-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 px-2 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="w-8 text-center">Set</span>
                    <span className="text-center">Kg</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">RPE</span>
                    <span className="w-8"></span>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => {
                      const setData = getSetData(exercise.id, setIndex, set);
                      return (
                        <div
                          key={set.id}
                          className={cn(
                            "grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center p-2 rounded-lg transition-all",
                            setData.done ? "bg-success/10" : "bg-secondary/30"
                          )}
                        >
                          <span className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold",
                            setData.done ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                          )}>
                            {setIndex + 1}
                          </span>
                          
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={setData.kg}
                            onChange={(e) => handleSetChange(exercise.id, setIndex, "kg", e.target.value)}
                            className="h-9 text-center text-sm font-medium bg-background/50 border-0"
                            placeholder={set.targetKg.toString()}
                            disabled={setData.done}
                          />
                          
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={setData.reps}
                            onChange={(e) => handleSetChange(exercise.id, setIndex, "reps", e.target.value)}
                            className="h-9 text-center text-sm font-medium bg-background/50 border-0"
                            placeholder={set.targetReps.toString()}
                            disabled={setData.done}
                          />
                          
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={setData.rpe}
                            onChange={(e) => handleSetChange(exercise.id, setIndex, "rpe", e.target.value)}
                            className="h-9 text-center text-sm font-medium bg-background/50 border-0"
                            placeholder={set.rpe.toString()}
                            disabled={setData.done}
                          />
                          
                          <div className="w-8 flex justify-center">
                            <Checkbox
                              checked={setData.done}
                              onCheckedChange={(checked) => 
                                handleSetChange(exercise.id, setIndex, "done", checked === true)
                              }
                              className="h-6 w-6 rounded-lg border-2 data-[state=checked]:bg-success data-[state=checked]:border-success"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ===== FLOATING REST TIMER ===== */}
        {showRestTimer && restTimer !== null && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rest</p>
                    <p className="text-3xl font-bold tabular-nums text-primary">
                      {formatTime(restTimer)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => adjustRestTime(-15)}
                      >
                        <span className="text-xs">-15</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => adjustRestTime(15)}
                      >
                        <span className="text-xs">+15</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setRestTimer(defaultRestTime)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={dismissRestTimer}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AthleteLayout>
  );
}
