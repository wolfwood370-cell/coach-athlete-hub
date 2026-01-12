import { useCallback, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calculator,
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
  supersetGroup?: string; // Link exercises in a superset
}

export type WeekProgram = Record<number, ProgramExercise[]>; // dayIndex -> exercises
export type ProgramData = Record<number, WeekProgram>; // weekIndex -> days

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const REST_OPTIONS = [30, 45, 60, 90, 120, 180, 240];

// Sortable exercise item within a day
function SortableExercise({
  exercise,
  dayIndex,
  weekIndex,
  oneRM,
  onUpdate,
  onRemove,
  onToggleSuperset,
  isInSuperset,
  supersetColor,
}: {
  exercise: ProgramExercise;
  dayIndex: number;
  weekIndex: number;
  oneRM: number;
  onUpdate: (updated: ProgramExercise) => void;
  onRemove: () => void;
  onToggleSuperset: () => void;
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

  // Calculate kg from percentage
  const getCalculatedKg = (loadStr: string): string | null => {
    const match = loadStr.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (match && oneRM > 0) {
      const percent = parseFloat(match[1]);
      const kg = Math.round(oneRM * (percent / 100));
      return `≈${kg}kg`;
    }
    return null;
  };

  const calculatedHint = getCalculatedKg(exercise.load);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background rounded-lg border p-2 space-y-1.5 group transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isInSuperset && "border-l-4",
        supersetColor
      )}
    >
      {/* Header Row */}
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 rounded hover:bg-secondary cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        
        <span className="text-[11px] font-medium truncate flex-1" title={exercise.name}>
          {exercise.name}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-5 w-5",
                isInSuperset ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"
              )}
              onClick={onToggleSuperset}
            >
              {isInSuperset ? <Unlink className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {isInSuperset ? "Rimuovi dal superset" : "Collega in superset"}
          </TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Sets x Reps @ Load */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={1}
          value={exercise.sets || ""}
          onChange={(e) => onUpdate({ ...exercise, sets: parseInt(e.target.value) || 0 })}
          className="h-6 w-8 text-[10px] text-center px-1"
          placeholder="S"
        />
        <span className="text-[10px] text-muted-foreground">×</span>
        <Input
          type="text"
          value={exercise.reps}
          onChange={(e) => onUpdate({ ...exercise, reps: e.target.value })}
          className="h-6 w-10 text-[10px] text-center px-1"
          placeholder="Rep"
        />
        <span className="text-[10px] text-muted-foreground">@</span>
        <div className="relative flex-1">
          <Input
            type="text"
            value={exercise.load}
            onChange={(e) => onUpdate({ ...exercise, load: e.target.value })}
            className={cn("h-6 text-[10px] px-1", calculatedHint && "pr-6")}
            placeholder="80%"
          />
          {calculatedHint && (
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-primary flex items-center gap-0.5">
              <Calculator className="h-2 w-2" />
            </span>
          )}
        </div>
      </div>

      {/* Hint */}
      {calculatedHint && (
        <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
          <Calculator className="h-2.5 w-2.5" />
          <span className="text-primary font-medium">{calculatedHint}</span>
        </p>
      )}

      {/* RPE & Rest */}
      <div className="flex items-center gap-1">
        <Select
          value={exercise.rpe?.toString() || ""}
          onValueChange={(val) => onUpdate({ ...exercise, rpe: val ? parseInt(val) : null })}
        >
          <SelectTrigger className="h-6 w-14 text-[10px]">
            <SelectValue placeholder="RPE" />
          </SelectTrigger>
          <SelectContent>
            {[6, 7, 8, 9, 10].map((rpe) => (
              <SelectItem key={rpe} value={rpe.toString()} className="text-xs">
                RPE {rpe}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={exercise.restSeconds.toString()}
          onValueChange={(val) => onUpdate({ ...exercise, restSeconds: parseInt(val) })}
        >
          <SelectTrigger className="h-6 flex-1 text-[10px]">
            <SelectValue placeholder="Rest" />
          </SelectTrigger>
          <SelectContent>
            {REST_OPTIONS.map((sec) => (
              <SelectItem key={sec} value={sec.toString()} className="text-xs">
                {sec >= 60 ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}` : `${sec}s`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <Input
        type="text"
        value={exercise.notes}
        onChange={(e) => onUpdate({ ...exercise, notes: e.target.value })}
        className="h-6 text-[10px] px-1.5"
        placeholder="Note..."
      />
    </div>
  );
}

// Droppable day cell
function DayCell({
  dayIndex,
  weekIndex,
  exercises,
  oneRM,
  onUpdateExercise,
  onRemoveExercise,
  onToggleSuperset,
}: {
  dayIndex: number;
  weekIndex: number;
  exercises: ProgramExercise[];
  oneRM: number;
  onUpdateExercise: (exerciseId: string, updated: ProgramExercise) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onToggleSuperset: (exerciseId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${weekIndex}-${dayIndex}`,
    data: { type: "day-cell", weekIndex, dayIndex },
  });

  // Get superset colors
  const supersetGroups = [...new Set(exercises.filter(e => e.supersetGroup).map(e => e.supersetGroup))];
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

  const totalVolume = exercises.reduce((acc, ex) => {
    const reps = parseInt(ex.reps) || 0;
    return acc + (ex.sets * reps);
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
        {exercises.length > 0 && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
            {exercises.length} ex • {totalVolume} vol
          </Badge>
        )}
      </div>

      {/* Exercise List */}
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
        <SortableContext
          items={exercises.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {exercises.map((exercise) => (
            <SortableExercise
              key={exercise.id}
              exercise={exercise}
              dayIndex={dayIndex}
              weekIndex={weekIndex}
              oneRM={oneRM}
              onUpdate={(updated) => onUpdateExercise(exercise.id, updated)}
              onRemove={() => onRemoveExercise(exercise.id)}
              onToggleSuperset={() => onToggleSuperset(exercise.id)}
              isInSuperset={!!exercise.supersetGroup}
              supersetColor={exercise.supersetGroup ? supersetColors[exercise.supersetGroup] : undefined}
            />
          ))}
        </SortableContext>

        {exercises.length === 0 && (
          <div className="h-full min-h-[100px] flex items-center justify-center">
            <div className="text-center">
              <Plus className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Trascina qui</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface WeekGridProps {
  currentWeek: number;
  totalWeeks: number;
  weekData: WeekProgram;
  oneRM: number;
  onWeekChange: (week: number) => void;
  onUpdateExercise: (dayIndex: number, exerciseId: string, updated: ProgramExercise) => void;
  onRemoveExercise: (dayIndex: number, exerciseId: string) => void;
  onToggleSuperset: (dayIndex: number, exerciseId: string) => void;
  onCopyWeek: () => void;
  onClearWeek: () => void;
}

export function WeekGrid({
  currentWeek,
  totalWeeks,
  weekData,
  oneRM,
  onWeekChange,
  onUpdateExercise,
  onRemoveExercise,
  onToggleSuperset,
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
              oneRM={oneRM}
              onUpdateExercise={(exerciseId, updated) => onUpdateExercise(dayIndex, exerciseId, updated)}
              onRemoveExercise={(exerciseId) => onRemoveExercise(dayIndex, exerciseId)}
              onToggleSuperset={(exerciseId) => onToggleSuperset(dayIndex, exerciseId)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
