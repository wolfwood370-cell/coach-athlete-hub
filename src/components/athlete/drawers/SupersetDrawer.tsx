// =============================================================================
// src/components/athlete/drawers/SupersetDrawer.tsx
// =============================================================================
// Phase 8 — Superset execution drawer.
//
// Adapted from superset_execution_drawer.html. Two grouped exercises (A1 +
// A2) sharing a single drawer; each renders its own logging table behind a
// 3px brand left "thread border" that visually links them.
//
// Layout deviations from the HTML (kept honest with the brief):
//   - "Play Video" link → omitted; the preview is reachable from
//     ExercisePreview earlier in the flow.
//   - Background mock content stripped.
//
// Footer CTA: "Termina Superset".
// =============================================================================

import { useState } from "react";
import { Check, X, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerShell } from "./DrawerShell";

interface SupersetRow {
  id: string;
  previous: string;
  kg: string;
  reps: string;
  done: boolean;
}

interface SupersetExercise {
  code: string;
  name: string;
  sets: SupersetRow[];
}

const INITIAL: SupersetExercise[] = [
  {
    code: "A1",
    name: "Barbell Back Squat",
    sets: [
      { id: "a1-1", previous: "100 kg × 8", kg: "105", reps: "8", done: false },
      { id: "a1-2", previous: "—", kg: "105", reps: "8", done: false },
    ],
  },
  {
    code: "A2",
    name: "Romanian Deadlift",
    sets: [
      { id: "a2-1", previous: "80 kg × 10", kg: "85", reps: "10", done: false },
      { id: "a2-2", previous: "—", kg: "85", reps: "10", done: false },
    ],
  },
];

interface SupersetDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SupersetDrawer({ open, onClose }: SupersetDrawerProps) {
  const [exercises, setExercises] = useState<SupersetExercise[]>(INITIAL);

  const updateField = (
    exerciseCode: string,
    rowId: string,
    field: keyof SupersetRow,
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.code === exerciseCode
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === rowId ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );
  };

  const toggleDone = (exerciseCode: string, rowId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.code === exerciseCode
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === rowId ? { ...s, done: !s.done } : s,
              ),
            }
          : ex,
      ),
    );
  };

  return (
    <DrawerShell open={open} onClose={onClose} ariaLabel="Esecuzione superset">
      {/* Header */}
      <header className="shrink-0 px-6 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
            Blocco A · Superset
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Completa A1 e A2 senza pausa, poi recupera.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors active:scale-95"
        >
          <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-8">
        {exercises.map((ex) => (
          <section
            key={ex.code}
            aria-label={`${ex.code} · ${ex.name}`}
            className="relative pl-5 border-l-[3px] border-brand-container"
          >
            <h3 className="font-display text-lg font-bold text-on-surface mb-4">
              <span className="text-brand-container mr-1.5">{ex.code}.</span>
              {ex.name}
            </h3>

            <div className="flex flex-col gap-3">
              {/* Header row */}
              <div className="grid grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 items-end px-1">
                {["Set", "Precedente", "kg", "reps", ""].map((label, i) => (
                  <span
                    key={i}
                    className={cn(
                      "font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant",
                      i === 1 ? "text-left" : "text-center",
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {ex.sets.map((row, idx) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 items-center"
                >
                  <span
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-display text-xs font-bold tabular-nums",
                      idx === 0
                        ? "bg-brand-container text-white"
                        : "bg-surface-container text-on-surface-variant",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-center text-sm text-on-surface-variant">
                    {row.previous}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`${ex.code} kg set ${idx + 1}`}
                    value={row.kg}
                    onChange={(e) =>
                      updateField(ex.code, row.id, "kg", e.target.value)
                    }
                    className={cn(
                      "w-full h-12 rounded-lg text-center font-display text-base font-semibold tabular-nums",
                      "bg-surface-container/60 text-on-surface",
                      idx === 0
                        ? "border-2 border-brand-container focus:ring-0"
                        : "border border-transparent focus:ring-2 focus:ring-brand-container",
                      "outline-none",
                    )}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`${ex.code} reps set ${idx + 1}`}
                    value={row.reps}
                    onChange={(e) =>
                      updateField(ex.code, row.id, "reps", e.target.value)
                    }
                    className={cn(
                      "w-full h-12 rounded-lg text-center font-display text-base font-semibold tabular-nums",
                      "bg-surface-container/60 text-on-surface border border-transparent",
                      "focus:ring-2 focus:ring-brand-container outline-none",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => toggleDone(ex.code, row.id)}
                    aria-label={`Set ${idx + 1} ${row.done ? "completato" : "da completare"}`}
                    aria-pressed={row.done}
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                      row.done
                        ? "bg-brand-container text-white"
                        : "bg-surface-container border border-[#c0c7d0]/50 text-on-surface-variant hover:border-brand-container hover:text-brand-container",
                    )}
                  >
                    <Check
                      className="h-4 w-4"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] border-t border-[#c0c7d0]/30 bg-white/85 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "w-full h-14 rounded-full",
            "flex items-center justify-center gap-2",
            "bg-brand-container text-white",
            "font-display text-sm font-bold tracking-widest uppercase",
            "shadow-[0_8px_20px_rgba(34,111,163,0.3)]",
            "transition-all duration-200",
            "hover:brightness-110 active:scale-[0.98]",
          )}
        >
          <Play
            className="h-5 w-5 fill-white"
            strokeWidth={0}
            aria-hidden="true"
          />
          Termina Superset
        </button>
      </footer>
    </DrawerShell>
  );
}

export default SupersetDrawer;
