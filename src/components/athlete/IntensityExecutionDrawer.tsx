import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Info, Plus, NotebookPen, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropChild {
  id: string;
  dropPercent: number; // e.g. 20 for -20%
  kg: string;
  reps: string;
  completed: boolean;
}

export interface IntensitySet {
  id: string;
  previous?: string;
  kg: string;
  reps: string;
  completed: boolean;
  drops: DropChild[];
}

interface IntensityExecutionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseLabel: string; // e.g. "C1. Machine Lateral Raise"
  protocol?: string; // e.g. "Double Drop Set"
  coachNote?: string;
  initialSets?: IntensitySet[];
  onFinish?: (sets: IntensitySet[]) => void;
}

const newDrop = (dropPercent = 20): DropChild => ({
  id: crypto.randomUUID(),
  dropPercent,
  kg: "",
  reps: "",
  completed: false,
});

const newSet = (dropsCount = 2): IntensitySet => ({
  id: crypto.randomUUID(),
  kg: "",
  reps: "",
  completed: false,
  drops: Array.from({ length: dropsCount }, () => newDrop(20)),
});

export function IntensityExecutionDrawer({
  open,
  onOpenChange,
  exerciseLabel,
  protocol = "Double Drop Set",
  coachNote,
  initialSets,
  onFinish,
}: IntensityExecutionDrawerProps) {
  const [sets, setSets] = useState<IntensitySet[]>(
    initialSets ?? [
      { ...newSet(2), previous: "15 x 12", kg: "15", reps: "12" },
    ],
  );

  const patchSet = (id: string, partial: Partial<IntensitySet>) =>
    setSets((s) => s.map((x) => (x.id === id ? { ...x, ...partial } : x)));

  const patchDrop = (setId: string, dropId: string, partial: Partial<DropChild>) =>
    setSets((s) =>
      s.map((x) =>
        x.id === setId
          ? { ...x, drops: x.drops.map((d) => (d.id === dropId ? { ...d, ...partial } : d)) }
          : x,
      ),
    );

  const addSet = () => setSets((s) => [...s, newSet(2)]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl border-0 p-0 flex flex-col bg-card"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h2 className="font-manrope font-extrabold text-2xl text-foreground tracking-tight truncate">
              {exerciseLabel}
            </h2>
            <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-[10px] uppercase tracking-wider">
              Protocollo: {protocol}
            </span>
          </div>
          <button
            type="button"
            className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary active:scale-95 transition-transform"
            aria-label="Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          <div className="grid grid-cols-[2.5rem_1.5fr_1fr_1fr_2.5rem] gap-2 mb-3 text-muted-foreground font-semibold text-[10px] uppercase tracking-widest px-2">
            <div>Set</div>
            <div>Previous</div>
            <div className="text-center">Kg</div>
            <div className="text-center">Reps</div>
            <div className="text-right">Done</div>
          </div>

          <div className="space-y-3">
            {sets.map((s, idx) => (
              <div key={s.id} className="space-y-3">
                {/* Parent set */}
                <div
                  className={cn(
                    "grid grid-cols-[2.5rem_1.5fr_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-xl border transition-colors",
                    s.completed
                      ? "bg-primary/5 border-primary/30"
                      : "bg-background border-border",
                  )}
                >
                  <div className="font-manrope font-extrabold text-lg text-primary text-center">
                    {idx + 1}
                  </div>
                  <div className="text-muted-foreground text-sm font-medium truncate">
                    {s.previous ?? "—"}
                  </div>
                  <input
                    inputMode="decimal"
                    value={s.kg}
                    onChange={(e) => patchSet(s.id, { kg: e.target.value })}
                    placeholder="kg"
                    className="w-full bg-background border-2 border-primary/40 text-primary font-bold text-center py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) => patchSet(s.id, { reps: e.target.value })}
                    placeholder="reps"
                    className="w-full bg-muted border-0 text-foreground font-medium text-center py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => patchSet(s.id, { completed: !s.completed })}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
                        s.completed
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 text-transparent",
                      )}
                      aria-label="Toggle set complete"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Drop children */}
                {s.drops.map((d) => (
                  <div key={d.id} className="ml-8 relative">
                    <span
                      aria-hidden
                      className="absolute -left-4 -top-3 w-3 h-6 border-l-2 border-b-2 border-primary/30 rounded-bl-lg"
                    />
                    <div
                      className={cn(
                        "grid grid-cols-[1.5fr_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-xl border transition-colors",
                        d.completed
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30 border-transparent",
                      )}
                    >
                      <div className="flex items-center">
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold text-[9px] uppercase tracking-wider">
                          -{d.dropPercent}% Drop
                        </span>
                      </div>
                      <input
                        inputMode="decimal"
                        value={d.kg}
                        onChange={(e) => patchDrop(s.id, d.id, { kg: e.target.value })}
                        placeholder="kg"
                        className="w-full bg-transparent border border-border text-foreground font-medium text-center py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        inputMode="numeric"
                        value={d.reps}
                        onChange={(e) => patchDrop(s.id, d.id, { reps: e.target.value })}
                        placeholder="-"
                        className="w-full bg-transparent border border-border text-foreground font-medium text-center py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => patchDrop(s.id, d.id, { completed: !d.completed })}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
                            d.completed
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 text-transparent",
                          )}
                          aria-label="Toggle drop complete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Add set + Coach note */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-4">
            <button
              type="button"
              onClick={addSet}
              className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Add Set
            </button>

            {coachNote && (
              <div className="bg-primary/5 rounded-xl p-4 flex gap-3">
                <NotebookPen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground font-medium italic">
                  {coachNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-card via-card to-transparent">
          <button
            type="button"
            onClick={() => onFinish?.(sets)}
            className="w-full py-4 bg-primary text-primary-foreground font-manrope font-bold text-lg rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Finish Exercise
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default IntensityExecutionDrawer;
