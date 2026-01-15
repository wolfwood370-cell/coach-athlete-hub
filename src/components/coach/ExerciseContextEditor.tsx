import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dumbbell,
  X,
  Calculator,
  Clock,
  Target,
  Hash,
  FileText,
  Zap,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgramExercise } from "@/components/coach/WeekGrid";

const REST_OPTIONS = [30, 45, 60, 90, 120, 180, 240, 300];
const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

interface ExerciseContextEditorProps {
  exercise: ProgramExercise;
  dayIndex: number;
  oneRM: number;
  onUpdate: (updated: ProgramExercise) => void;
  onClose: () => void;
  className?: string;
}

export function ExerciseContextEditor({
  exercise,
  dayIndex,
  oneRM,
  onUpdate,
  onClose,
  className,
}: ExerciseContextEditorProps) {
  const [localExercise, setLocalExercise] = useState<ProgramExercise>(exercise);

  // Sync when exercise changes externally
  useEffect(() => {
    setLocalExercise(exercise);
  }, [exercise]);

  // Debounced update
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (JSON.stringify(localExercise) !== JSON.stringify(exercise)) {
        onUpdate(localExercise);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [localExercise, exercise, onUpdate]);

  const handleChange = <K extends keyof ProgramExercise>(
    key: K,
    value: ProgramExercise[K]
  ) => {
    setLocalExercise((prev) => ({ ...prev, [key]: value }));
  };

  // Calculate kg from percentage
  const getCalculatedKg = (loadStr: string): string | null => {
    const match = loadStr.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (match && oneRM > 0) {
      const percent = parseFloat(match[1]);
      const kg = Math.round(oneRM * (percent / 100));
      return `${kg} kg`;
    }
    return null;
  };

  const calculatedKg = getCalculatedKg(localExercise.load);

  // Format rest time
  const formatRest = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins} min`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-card border-l border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{localExercise.name}</h3>
                <p className="text-[10px] text-muted-foreground">{DAYS[dayIndex]}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Volume Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Target className="h-3.5 w-3.5" />
              Volume
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Sets */}
              <div className="space-y-1.5">
                <Label htmlFor="sets" className="text-xs flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  Serie
                </Label>
                <Input
                  id="sets"
                  type="number"
                  min={1}
                  max={20}
                  value={localExercise.sets || ""}
                  onChange={(e) => handleChange("sets", parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>

              {/* Reps */}
              <div className="space-y-1.5">
                <Label htmlFor="reps" className="text-xs flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  Ripetizioni
                </Label>
                <Input
                  id="reps"
                  type="text"
                  value={localExercise.reps}
                  onChange={(e) => handleChange("reps", e.target.value)}
                  placeholder="8-10"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Intensity Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calculator className="h-3.5 w-3.5" />
              Intensità
            </div>

            {/* Load */}
            <div className="space-y-1.5">
              <Label htmlFor="load" className="text-xs">Carico</Label>
              <div className="relative">
                <Input
                  id="load"
                  type="text"
                  value={localExercise.load}
                  onChange={(e) => handleChange("load", e.target.value)}
                  placeholder="80% o 100kg"
                  className="h-9 pr-20"
                />
                {calculatedKg && (
                  <Badge 
                    variant="secondary" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] h-5"
                  >
                    ≈ {calculatedKg}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Puoi usare % (basato su 1RM: {oneRM}kg) o kg diretti
              </p>
            </div>

            {/* RPE */}
            <div className="space-y-1.5">
              <Label htmlFor="rpe" className="text-xs">RPE (Rate of Perceived Exertion)</Label>
              <Select
                value={localExercise.rpe?.toString() || ""}
                onValueChange={(val) => handleChange("rpe", val ? parseInt(val) : null)}
              >
                <SelectTrigger id="rpe" className="h-9">
                  <SelectValue placeholder="Seleziona RPE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessuno</SelectItem>
                  {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpe) => (
                    <SelectItem key={rpe} value={rpe.toString()}>
                      RPE {rpe} {rpe >= 9.5 ? "- Massimale" : rpe >= 8.5 ? "- Molto duro" : rpe >= 7 ? "- Moderato" : "- Leggero"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Timing Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Timer className="h-3.5 w-3.5" />
              Tempo
            </div>

            {/* Rest */}
            <div className="space-y-1.5">
              <Label htmlFor="rest" className="text-xs flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Recupero
              </Label>
              <Select
                value={localExercise.restSeconds.toString()}
                onValueChange={(val) => handleChange("restSeconds", parseInt(val))}
              >
                <SelectTrigger id="rest" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REST_OPTIONS.map((sec) => (
                    <SelectItem key={sec} value={sec.toString()}>
                      {formatRest(sec)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tempo (optional - if needed later) */}
            {/* You can add tempo input here for advanced users */}
          </div>

          <Separator />

          {/* Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" />
              Note
            </div>

            <Textarea
              value={localExercise.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Istruzioni speciali, cue tecniche, variazioni..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          {/* Superset Info */}
          {localExercise.supersetGroup && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px]">Superset</Badge>
                  <span className="text-xs text-muted-foreground">
                    Collegato ad altri esercizi
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Le modifiche sono salvate automaticamente</span>
          <Badge variant="outline" className="text-[9px]">
            {localExercise.sets} × {localExercise.reps || "?"} @ {localExercise.load || "?"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
