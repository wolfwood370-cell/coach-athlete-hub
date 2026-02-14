import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useSetMutation } from "@/hooks/useSetMutation";

interface SetInputRowProps {
  exerciseId: string;
  setNumber: number;
  targetKg: number;
  targetReps: number;
  targetRpe?: number;
  actualKg: string;
  actualReps: string;
  rpe: string;
  completed: boolean;
  onUpdate: (field: string, value: string | boolean) => void;
  onComplete: (completed: boolean) => void;
}

function getRpeColor(rpe: number): string {
  if (rpe <= 3) return "text-emerald-500";
  if (rpe <= 5) return "text-yellow-500";
  if (rpe <= 7) return "text-orange-500";
  return "text-red-500";
}

export const SetInputRow = memo(function SetInputRow({
  exerciseId,
  setNumber,
  targetKg,
  targetReps,
  targetRpe,
  actualKg,
  actualReps,
  rpe,
  completed,
  onUpdate,
  onComplete,
}: SetInputRowProps) {
  const { mutate: syncSet } = useSetMutation();

  const handleUpdate = (field: string, value: string | boolean) => {
    onUpdate(field, value);
    syncSet({ exerciseId, setIndex: setNumber - 1, field, value });
  };

  const handleComplete = (checked: boolean) => {
    onComplete(checked);
    syncSet({ exerciseId, setIndex: setNumber - 1, field: "completed", value: checked });
  };
  return (
    <div
      className={cn(
        "grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-2 items-center p-2.5 rounded-xl transition-all duration-300",
        completed
          ? "bg-primary/10 ring-1 ring-primary/20"
          : "bg-[hsl(var(--m3-surface-container,var(--secondary)))]"
      )}
    >
      {/* Set Number */}
      <div className="text-center">
        <span
          className={cn(
            "text-sm font-bold",
            completed ? "text-primary" : "text-muted-foreground"
          )}
        >
          {setNumber}
        </span>
        <p className="text-[9px] text-muted-foreground leading-none mt-0.5">
          {targetKg > 0 ? `${targetKg}kg` : "—"}
        </p>
      </div>

      {/* Weight Input - Large tap target */}
      <Input
        type="number"
        inputMode="decimal"
        placeholder={targetKg > 0 ? targetKg.toString() : "kg"}
        value={actualKg}
        onChange={(e) => handleUpdate("actualKg", e.target.value)}
        className={cn(
          "h-11 text-center text-sm font-semibold rounded-lg border-0",
          completed
            ? "bg-primary/5 text-primary"
            : "bg-background"
        )}
      />

      {/* Reps Input */}
      <Input
        type="number"
        inputMode="numeric"
        placeholder={targetReps.toString()}
        value={actualReps}
        onChange={(e) => handleUpdate("actualReps", e.target.value)}
        className={cn(
          "h-11 text-center text-sm font-semibold rounded-lg border-0",
          completed
            ? "bg-primary/5 text-primary"
            : "bg-background"
        )}
      />

      {/* RPE Input */}
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        max={10}
        placeholder={targetRpe ? targetRpe.toString() : "RPE"}
        value={rpe}
        onChange={(e) => handleUpdate("rpe", e.target.value)}
        className={cn(
          "h-11 text-center text-sm font-semibold rounded-lg border-0",
          completed ? "bg-primary/5" : "bg-background",
          rpe && getRpeColor(parseInt(rpe))
        )}
      />

      {/* Complete Checkbox - Extra large */}
      <div className="flex justify-center">
        <Checkbox
          checked={completed}
          onCheckedChange={(checked) => handleComplete(checked as boolean)}
          className={cn(
            "h-7 w-7 rounded-full transition-all duration-200",
            completed && "border-primary bg-primary text-primary-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          )}
        />
      </div>
    </div>
  );
});
