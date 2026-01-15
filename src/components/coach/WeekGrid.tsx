import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Link2,
  Unlink,
  Copy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Layers,
  Loader2,
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
  isEmpty?: boolean;
  // Snapshot fields - frozen at time of adding to program
  snapshotTrackingFields?: string[];
  snapshotMuscles?: string[];
}

export type WeekProgram = Record<number, ProgramExercise[]>;
export type ProgramData = Record<number, WeekProgram>;

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const DAYS_FULL = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

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
        "relative border-2 border-dashed rounded-lg p-4 text-center transition-all group min-h-[52px] flex items-center justify-center",
        isOver
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-muted-foreground/40 bg-muted/10 opacity-70 hover:opacity-90 hover:border-muted-foreground/60"
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
      <p className="text-[10px] text-muted-foreground/80 font-medium">
        Trascina esercizio qui
      </p>
    </div>
  );
}

// Compact sortable exercise card with drag handle
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
    setActivatorNodeRef,
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

  // Compact summary: Sets x Reps + RPE only
  const setsReps = exercise.sets ? `${exercise.sets}×${exercise.reps || "?"}` : null;
  const rpeText = exercise.rpe ? `RPE ${exercise.rpe}` : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        // Prevent click when clicking buttons or drag handle
        if ((e.target as HTMLElement).closest("button, [data-drag-handle]")) return;
        onSelect?.();
      }}
      className={cn(
        "bg-card rounded-lg border shadow-sm transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary z-50",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5",
        isInSuperset && "border-l-4",
        supersetColor,
        !isDragging && "hover:shadow-md"
      )}
    >
      <div className="flex items-stretch">
        {/* Drag Handle - distinct touch target for mobile */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          data-drag-handle
          className={cn(
            "flex items-center justify-center px-1.5 rounded-l-lg border-r border-border/50",
            "bg-muted/30 hover:bg-muted cursor-grab active:cursor-grabbing",
            "touch-none select-none flex-shrink-0"
          )}
        >
          <div className="flex flex-col gap-[2px]">
            <div className="flex gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
            </div>
            <div className="flex gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
            </div>
            <div className="flex gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
            </div>
          </div>
        </button>

        {/* Card Content */}
        <div className="flex-1 p-2 min-w-0 group cursor-pointer">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate leading-tight" title={exercise.name}>
                {exercise.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {setsReps && (
                  <span className="text-[10px] font-medium text-foreground/80">
                    {setsReps}
                  </span>
                )}
                {rpeText && (
                  <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">
                    {rpeText}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons - visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isInSuperset && "text-primary opacity-100"
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
                className="h-5 w-5 text-destructive hover:text-destructive flex-shrink-0"
                onClick={onRemove}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
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
  onCopyDay,
}: {
  dayIndex: number;
  weekIndex: number;
  exercises: ProgramExercise[];
  selectedExerciseId?: string | null;
  onRemoveExercise: (exerciseId: string) => void;
  onToggleSuperset: (exerciseId: string) => void;
  onSelectExercise?: (exercise: ProgramExercise) => void;
  onAddSlot: () => void;
  onCopyDay: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${weekIndex}-${dayIndex}`,
    data: { type: "day-cell", weekIndex, dayIndex },
  });

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
      <div className="px-2 py-1.5 border-b border-border/50 bg-muted/30 flex items-center justify-between group">
        <span className="text-xs font-semibold">{DAYS[dayIndex]}</span>
        <div className="flex items-center gap-1">
          {filledExercises.length > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={onCopyDay}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copia allenamento</TooltipContent>
              </Tooltip>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                {filledExercises.length} ex
              </Badge>
            </>
          )}
        </div>
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

// Copy Day Dialog
function CopyDayDialog({
  open,
  onOpenChange,
  sourceDayIndex,
  isLoading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDayIndex: number;
  isLoading?: boolean;
  onConfirm: (targetDays: number[], mode: "append" | "overwrite") => void;
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [mode, setMode] = useState<"append" | "overwrite">("append");

  const handleConfirm = () => {
    if (selectedDays.length > 0) {
      onConfirm(selectedDays, mode);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedDays([]);
      setMode("append");
    }
    onOpenChange(isOpen);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Copia Allenamento
          </DialogTitle>
          <DialogDescription>
            Copia da: <strong>{DAYS_FULL[sourceDayIndex]}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Seleziona giorni destinazione</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_FULL.map((day, idx) =>
                idx !== sourceDayIndex ? (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border",
                      selectedDays.includes(idx)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-secondary border-transparent"
                    )}
                    onClick={() => toggleDay(idx)}
                  >
                    <Checkbox checked={selectedDays.includes(idx)} />
                    <span className="text-sm">{day}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Modalità</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "append" | "overwrite")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="append" id="append" />
                <Label htmlFor="append" className="text-sm cursor-pointer">
                  Aggiungi (mantieni esercizi esistenti)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite" className="text-sm cursor-pointer">
                  Sovrascrivi (sostituisci tutto)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} disabled={selectedDays.length === 0 || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Copia in {selectedDays.length} giorni
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Copy Week Dialog
function CopyWeekDialog({
  open,
  onOpenChange,
  sourceWeek,
  totalWeeks,
  isLoading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWeek: number;
  totalWeeks: number;
  isLoading?: boolean;
  onConfirm: (targetWeeks: number[]) => void;
}) {
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);

  const handleConfirm = () => {
    if (selectedWeeks.length > 0) {
      onConfirm(selectedWeeks);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedWeeks([]);
    }
    onOpenChange(isOpen);
  };

  const toggleWeek = (weekIndex: number) => {
    setSelectedWeeks((prev) =>
      prev.includes(weekIndex)
        ? prev.filter((w) => w !== weekIndex)
        : [...prev, weekIndex]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Copia Settimana
          </DialogTitle>
          <DialogDescription>
            Copia da: <strong>Settimana {sourceWeek + 1}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Seleziona settimane destinazione</Label>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: totalWeeks }, (_, idx) =>
                idx !== sourceWeek ? (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border",
                      selectedWeeks.includes(idx)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-secondary border-transparent"
                    )}
                    onClick={() => toggleWeek(idx)}
                  >
                    <Checkbox checked={selectedWeeks.includes(idx)} />
                    <span className="text-sm">Sett. {idx + 1}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Le settimane selezionate verranno <strong>sostituite</strong> completamente.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} disabled={selectedWeeks.length === 0 || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Layers className="h-4 w-4 mr-2" />
            )}
            Copia in {selectedWeeks.length} settimane
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WeekGridProps {
  currentWeek: number;
  totalWeeks: number;
  weekData: WeekProgram;
  selectedExerciseId?: string | null;
  isCopyingDay?: boolean;
  isCopyingWeek?: boolean;
  onWeekChange: (week: number) => void;
  onRemoveExercise: (dayIndex: number, exerciseId: string) => void;
  onToggleSuperset: (dayIndex: number, exerciseId: string) => void;
  onSelectExercise?: (dayIndex: number, exercise: ProgramExercise) => void;
  onAddSlot: (dayIndex: number) => void;
  onCopyDay: (sourceDayIndex: number, targetDays: number[], mode: "append" | "overwrite") => void;
  onCopyWeekTo: (targetWeeks: number[]) => void;
  onClearWeek: () => void;
  onCopyDayDialogClose?: () => void;
  onCopyWeekDialogClose?: () => void;
}

export function WeekGrid({
  currentWeek,
  totalWeeks,
  weekData,
  selectedExerciseId,
  isCopyingDay,
  isCopyingWeek,
  onWeekChange,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
  onAddSlot,
  onCopyDay,
  onCopyWeekTo,
  onClearWeek,
  onCopyDayDialogClose,
  onCopyWeekDialogClose,
}: WeekGridProps) {
  const [copyDayDialogOpen, setCopyDayDialogOpen] = useState(false);
  const [copyDaySource, setCopyDaySource] = useState(0);
  const [copyWeekDialogOpen, setCopyWeekDialogOpen] = useState(false);

  const handleOpenCopyDayDialog = (dayIndex: number) => {
    setCopyDaySource(dayIndex);
    setCopyDayDialogOpen(true);
  };

  const handleCopyDayConfirm = (targetDays: number[], mode: "append" | "overwrite") => {
    onCopyDay(copyDaySource, targetDays, mode);
  };

  // Close dialogs when copy operation completes
  const handleCopyDayDialogChange = (open: boolean) => {
    setCopyDayDialogOpen(open);
    if (!open) onCopyDayDialogClose?.();
  };

  const handleCopyWeekDialogChange = (open: boolean) => {
    setCopyWeekDialogOpen(open);
    if (!open) onCopyWeekDialogClose?.();
  };

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
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCopyWeekDialogOpen(true)}
              >
                <Layers className="h-3 w-3 mr-1" />
                Copia Sett.
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copia settimana in altre settimane</TooltipContent>
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
              onCopyDay={() => handleOpenCopyDayDialog(dayIndex)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Copy Day Dialog */}
      <CopyDayDialog
        open={copyDayDialogOpen}
        onOpenChange={handleCopyDayDialogChange}
        sourceDayIndex={copyDaySource}
        isLoading={isCopyingDay}
        onConfirm={handleCopyDayConfirm}
      />

      {/* Copy Week Dialog */}
      <CopyWeekDialog
        open={copyWeekDialogOpen}
        onOpenChange={handleCopyWeekDialogChange}
        sourceWeek={currentWeek}
        totalWeeks={totalWeeks}
        isLoading={isCopyingWeek}
        onConfirm={onCopyWeekTo}
      />
    </div>
  );
}
