import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GripVertical,
  Trash2,
  Link2,
  Unlink,
  Copy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export interface ProgramExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  load: string;
  rpe: number | null;
  restSeconds: number;
  notes: string;
  supersetGroup?: string;
  isEmpty?: boolean; // Empty slot placeholder
}

export type WeekProgram = Record<number, ProgramExercise[]>; // dayIndex -> exercises
export type ProgramData = Record<number, WeekProgram>; // weekIndex -> days

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Empty slot - droppable placeholder
function EmptySlot({
  slotId,
  dayIndex,
  weekIndex,
  onRemove,
}: {
  slotId: string;
  dayIndex: number;
  weekIndex: number;
  onRemove: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    data: { type: "empty-slot", weekIndex, dayIndex, slotId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-3 text-center transition-all group",
        isOver
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-0.5 right-0.5 h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      <p className="text-[10px] text-muted-foreground">
        Trascina qui un esercizio
      </p>
    </div>
  );
}

// Compact sortable exercise card
function SortableExercise({
  exercise,
  dayIndex,
  weekIndex,
  isSelected,
  onRemove,
  onToggleSuperset,
  onSelect,
  isInSuperset,
  supersetColor,
}: {
  exercise: ProgramExercise;
  dayIndex: number;
  weekIndex: number;
  isSelected?: boolean;
  onRemove: () => void;
  onToggleSuperset: () => void;
  onSelect?: () => void;
  isInSuperset: boolean;
  supersetColor?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    data: { type: "program-exercise", exercise, dayIndex, weekIndex },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Build summary string
  const summary = [
    exercise.sets ? `${exercise.sets}x${exercise.reps || "?"}` : null,
    exercise.load || null,
    exercise.rpe ? `RPE ${exercise.rpe}` : null,
  ]
    .filter(Boolean)
    .join(" @ ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onSelect?.();
      }}
      className={cn(
        "bg-background rounded-lg border p-2 group transition-all cursor-pointer",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5",
        isInSuperset && "border-l-4",
        supersetColor
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 rounded hover:bg-secondary cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-medium truncate"
            title={exercise.name}
          >
            {exercise.name}
          </p>
          {summary && (
            <p className="text-[9px] text-muted-foreground truncate">
              {summary}
            </p>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-5 w-5 flex-shrink-0",
                isInSuperset
                  ? "text-primary"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100"
              )}
              onClick={onToggleSuperset}
            >
              {isInSuperset ? (
                <Unlink className="h-3 w-3" />
              ) : (
                <Link2 className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {isInSuperset ? "Rimuovi dal superset" : "Collega in superset"}
          </TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 hover:text-destructive flex-shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Droppable day cell with slot support
function DayCell({
  dayIndex,
  weekIndex,
  exercises,
  selectedExerciseId,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
  onAddSlot,
}: {
  dayIndex: number;
  weekIndex: number;
  exercises: ProgramExercise[];
  selectedExerciseId?: string | null;
  onRemoveExercise: (exerciseId: string) => void;
  onToggleSuperset: (exerciseId: string) => void;
  onSelectExercise?: (exercise: ProgramExercise) => void;
  onAddSlot: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${weekIndex}-${dayIndex}`,
    data: { type: "day-cell", weekIndex, dayIndex },
  });

  // Get superset colors
  const supersetGroups = [
    ...new Set(
      exercises.filter((e) => e.supersetGroup && !e.isEmpty).map((e) => e.supersetGroup)
    ),
  ];
  const supersetColors: Record<string, string> = {};
  const colors = [
    "border-l-primary",
    "border-l-success",
    "border-l-warning",
    "border-l-accent",
  ];
  supersetGroups.forEach((group, i) => {
    if (group) supersetColors[group] = colors[i % colors.length];
  });

  const filledExercises = exercises.filter((e) => !e.isEmpty);
  const totalVolume = filledExercises.reduce((acc, ex) => {
    const reps = parseInt(ex.reps) || 0;
    return acc + ex.sets * reps;
  }, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-[150px] rounded-lg border transition-all",
        isOver && "ring-2 ring-primary border-primary bg-primary/5",
        exercises.length === 0 && "border-dashed"
      )}
    >
      {/* Day Header */}
      <div className="px-2 py-1.5 border-b border-border/50 bg-muted/30 flex items-center justify-between">
        <span className="text-xs font-semibold">{DAYS[dayIndex]}</span>
        {filledExercises.length > 0 && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
            {filledExercises.length} ex • {totalVolume} vol
          </Badge>
        )}
      </div>

      {/* Exercise List */}
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
        <SortableContext
          items={exercises.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {exercises.map((exercise) =>
            exercise.isEmpty ? (
              <EmptySlot
                key={exercise.id}
                slotId={exercise.id}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                onRemove={() => onRemoveExercise(exercise.id)}
              />
            ) : (
              <SortableExercise
                key={exercise.id}
                exercise={exercise}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                isSelected={selectedExerciseId === exercise.id}
                onRemove={() => onRemoveExercise(exercise.id)}
                onToggleSuperset={() => onToggleSuperset(exercise.id)}
                onSelect={() => onSelectExercise?.(exercise)}
                isInSuperset={!!exercise.supersetGroup}
                supersetColor={
                  exercise.supersetGroup
                    ? supersetColors[exercise.supersetGroup]
                    : undefined
                }
              />
            )
          )}
        </SortableContext>

        {exercises.length === 0 && (
          <div className="h-full min-h-[80px] flex items-center justify-center">
            <div className="text-center">
              <Plus className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Trascina qui</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Slot Button */}
      <div className="p-1.5 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
          onClick={onAddSlot}
        >
          <Plus className="h-3 w-3 mr-1" />
          Aggiungi slot
        </Button>
      </div>
    </div>
  );
}

interface WeekGridProps {
  currentWeek: number;
  totalWeeks: number;
  weekData: WeekProgram;
  selectedExerciseId?: string | null;
  onWeekChange: (week: number) => void;
  onRemoveExercise: (dayIndex: number, exerciseId: string) => void;
  onToggleSuperset: (dayIndex: number, exerciseId: string) => void;
  onSelectExercise?: (dayIndex: number, exercise: ProgramExercise) => void;
  onAddSlot: (dayIndex: number) => void;
  onCopyWeek: () => void;
  onClearWeek: () => void;
}

export function WeekGrid({
  currentWeek,
  totalWeeks,
  weekData,
  selectedExerciseId,
  onWeekChange,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
  onAddSlot,
  onCopyWeek,
  onClearWeek,
}: WeekGridProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onWeekChange(currentWeek - 1)}
            disabled={currentWeek <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[100px] text-center">
            Settimana {currentWeek + 1} / {totalWeeks}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onWeekChange(currentWeek + 1)}
            disabled={currentWeek >= totalWeeks - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCopyWeek}>
                <Copy className="h-3 w-3 mr-1" />
                Copia
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copia in settimana successiva</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClearWeek}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Pulisci
              </Button>
            </TooltipTrigger>
            <TooltipContent>Svuota questa settimana</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Days Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-7 gap-2 p-2 min-h-full">
          {DAYS.map((_, dayIndex) => (
            <DayCell
              key={dayIndex}
              dayIndex={dayIndex}
              weekIndex={currentWeek}
              exercises={weekData[dayIndex] || []}
              selectedExerciseId={selectedExerciseId}
              onRemoveExercise={(exerciseId) => onRemoveExercise(dayIndex, exerciseId)}
              onToggleSuperset={(exerciseId) => onToggleSuperset(dayIndex, exerciseId)}
              onSelectExercise={(exercise) => onSelectExercise?.(dayIndex, exercise)}
              onAddSlot={() => onAddSlot(dayIndex)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
