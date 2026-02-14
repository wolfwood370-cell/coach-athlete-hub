import { useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dumbbell,
  Play,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
  History,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SetInputRow } from "./SetInputRow";
import { PlateCalculator } from "./PlateCalculator";
import type { LastSetData } from "@/hooks/useExerciseHistory";
import { motion } from "framer-motion";

export interface SetData {
  id: string;
  setNumber: number;
  targetKg: number;
  targetReps: number;
  targetRpe?: number;
  actualKg: string;
  actualReps: string;
  rpe: string;
  completed: boolean;
}

export interface ExerciseData {
  id: string;
  name: string;
  videoUrl?: string;
  coachNotes?: string;
  restSeconds: number;
  supersetGroup?: string;
  sets: SetData[];
  originalSetsCount?: number;
  originalTargetRpe?: number;
}

interface ExerciseCardProps {
  exercise: ExerciseData;
  exerciseIndex: number;
  isActive: boolean;
  isRecoveryMode: boolean;
  supersetInfo?: { index: number; total: number; isFirst: boolean };
  historyData?: LastSetData | null;
  onSetUpdate: (exerciseId: string, setId: string, field: string, value: string | boolean) => void;
  onSetComplete: (exerciseId: string, setId: string, completed: boolean) => void;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  exerciseIndex,
  isActive,
  isRecoveryMode,
  supersetInfo,
  historyData,
  onSetUpdate,
  onSetComplete,
}: ExerciseCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [plateCalcOpen, setPlateCalcOpen] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const allCompleted = completedSets === exercise.sets.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: exerciseIndex * 0.05 }}
    >
      <Card
        className={cn(
          "border-0 overflow-hidden transition-all duration-300",
          isActive
            ? "bg-[hsl(var(--m3-surface-container-high,var(--card)))] shadow-lg ring-1 ring-primary/10"
            : "bg-[hsl(var(--m3-surface-container,var(--card)))]",
          supersetInfo && "border-l-4 border-l-primary",
          allCompleted && "ring-1 ring-primary/30"
        )}
      >
        <CardContent className="p-0">
          {/* Superset indicator */}
          {supersetInfo?.isFirst && (
            <div className="px-4 py-1.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Superset ({supersetInfo.total} esercizi)
              </span>
            </div>
          )}

          {/* Exercise Header */}
          <div className="p-4 border-b border-border/20">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  allCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/15"
                )}
              >
                <Dumbbell className={cn("h-5 w-5", !allCompleted && "text-primary")} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {supersetInfo
                    ? `${supersetInfo.index + 1}/${supersetInfo.total}`
                    : `Esercizio ${exerciseIndex + 1}`}
                </span>
                <h3 className="font-semibold text-sm">{exercise.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {/* Sets × Reps */}
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {isRecoveryMode &&
                    exercise.originalSetsCount &&
                    exercise.originalSetsCount !== exercise.sets.length ? (
                      <>
                        <span className="line-through text-muted-foreground/60 mr-1">
                          {exercise.originalSetsCount}
                        </span>
                        <span className="text-amber-600">{exercise.sets.length}</span>
                      </>
                    ) : (
                      exercise.sets.length
                    )}
                    {" × "}
                    {exercise.sets[0]?.targetReps || 8}
                  </Badge>

                  {/* Weight */}
                  {exercise.sets[0]?.targetKg > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 gap-0.5 cursor-pointer hover:bg-primary/10"
                      onClick={() => setPlateCalcOpen(true)}
                    >
                      {exercise.sets[0].targetKg}kg
                      <Calculator className="h-2.5 w-2.5 ml-0.5 text-primary" />
                    </Badge>
                  )}

                  {/* RPE */}
                  {exercise.sets[0]?.targetRpe && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5",
                        isRecoveryMode && "border-amber-500/30 bg-amber-500/10"
                      )}
                    >
                      RPE:{" "}
                      {isRecoveryMode &&
                      exercise.originalTargetRpe &&
                      exercise.originalTargetRpe !== exercise.sets[0].targetRpe ? (
                        <>
                          <span className="line-through text-muted-foreground/60 mx-0.5">
                            {exercise.originalTargetRpe}
                          </span>
                          <span className="text-amber-600 font-semibold">
                            {exercise.sets[0].targetRpe}
                          </span>
                        </>
                      ) : (
                        <span>{exercise.sets[0].targetRpe}</span>
                      )}
                    </Badge>
                  )}

                  {/* Progress */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5",
                      allCompleted && "bg-primary/10 border-primary/30 text-primary"
                    )}
                  >
                    {completedSets}/{exercise.sets.length} ✓
                  </Badge>
                </div>
              </div>
            </div>

            {/* History context */}
            {historyData && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {historyData.weight_kg}kg × {historyData.reps}
                    {historyData.rpe ? ` @RPE${historyData.rpe}` : ""}
                  </span>
                  {" — "}
                  {new Date(historyData.date).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            )}

            {/* Video thumbnail */}
            {exercise.videoUrl && (
              <div
                className="mt-3 aspect-video bg-secondary/50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-secondary/70 transition-colors overflow-hidden"
                onClick={() => setVideoExpanded(!videoExpanded)}
              >
                {videoExpanded ? (
                  <video
                    src={exercise.videoUrl}
                    controls
                    className="w-full h-full object-cover rounded-xl"
                    autoPlay
                    playsInline
                  />
                ) : (
                  <Play className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            )}

            {/* Coach Notes */}
            {exercise.coachNotes && (
              <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
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
                    {notesOpen ? (
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
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                Set
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                Kg
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                Reps
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                RPE
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                ✓
              </span>
            </div>

            {/* Sets Rows */}
            <div className="space-y-2">
              {exercise.sets.map((set) => (
                <SetInputRow
                  key={set.id}
                  exerciseId={exercise.id}
                  setNumber={set.setNumber}
                  targetKg={set.targetKg}
                  targetReps={set.targetReps}
                  targetRpe={set.targetRpe}
                  actualKg={set.actualKg}
                  actualReps={set.actualReps}
                  rpe={set.rpe}
                  completed={set.completed}
                  onUpdate={(field, value) => onSetUpdate(exercise.id, set.id, field, value)}
                  onComplete={(completed) => onSetComplete(exercise.id, set.id, completed)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plate Calculator */}
      <PlateCalculator
        open={plateCalcOpen}
        onOpenChange={setPlateCalcOpen}
        weightKg={exercise.sets[0]?.targetKg || 0}
      />
    </motion.div>
  );
});
