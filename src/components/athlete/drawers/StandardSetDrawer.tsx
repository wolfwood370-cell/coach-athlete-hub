// =============================================================================
// src/components/athlete/drawers/StandardSetDrawer.tsx
// =============================================================================
// Phase 8 — Standard sets execution drawer.
//
// Renders inside <DrawerShell>. Mirrors exercise_execution_drawer.html:
//   - Header with title, sub-line (phase + RPE), close affordance.
//   - Coach's protocol card (left brand border).
//   - Sets table: Set / Previous / kg / reps / RPE / Done.
//     * Completed rows: brand tint background + checkmark filled.
//     * Active row: white surface, focused inputs with brand border.
//   - "Add Set" button at the bottom of the list.
//   - Sticky footer: "Termina Esercizio" pill.
//
// Inputs use type="number" inputMode="decimal" per brief.
// All state is local React (no Supabase). Mock initial seed reflects
// a partially completed exercise.
// =============================================================================

import { useState } from "react";
import { Plus, X, Megaphone, Play, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerShell } from "./DrawerShell";

interface SetRow {
  id: string;
  /** Previous-session reference shown read-only. */
  previous: string;
  kg: string;
  reps: string;
  rpe: string;
  done: boolean;
}

const INITIAL_SETS: SetRow[] = [
  { id: "1", previous: "100kg × 8", kg: "100", reps: "8", rpe: "8", done: true },
  { id: "2", previous: "105kg × 8", kg: "105", reps: "8", rpe: "", done: false },
];

interface StandardSetDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Optional override title — defaults to the mock "A1. Barbell Back Squat". */
  exerciseName?: string;
  meta?: string;
}

export function StandardSetDrawer({
  open,
  onClose,
  exerciseName = "A1. Barbell Back Squat",
  meta = "Forza Primaria · RPE 8",
}: StandardSetDrawerProps) {
  const [sets, setSets] = useState<SetRow[]>(INITIAL_SETS);

  const updateField = (id: string, field: keyof SetRow, value: string) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const toggleDone = (id: string) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
  };

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        previous: last?.previous ?? "—",
        kg: last?.kg ?? "",
        reps: last?.reps ?? "",
        rpe: "",
        done: false,
      },
    ]);
  };

  return (
    <DrawerShell open={open} onClose={onClose} ariaLabel={`Esecuzione ${exerciseName}`}>
      {/* Header */}
      <header className="shrink-0 px-6 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-on-surface truncate">
            {exerciseName}
          </h2>
          <p className="mt-1 font-sans text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant">
            {meta}
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5">
        {/* Coach's protocol */}
        <div
          className={cn(
            "rounded-2xl p-4",
            "bg-surface-container/50 border-l-4 border-brand-container",
            "border border-brand-container/15",
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Megaphone
              className="h-4 w-4 text-brand-container"
              strokeWidth={2}
              aria-hidden="true"
            />
            <h3 className="font-display text-[11px] font-bold tracking-widest uppercase text-brand-container">
              Note del Coach
            </h3>
          </div>
          <p className="text-sm text-on-surface">
            Eccentrica controllata di 3 secondi. Esplosivo in concentrica. Non
            sacrificare la profondità per il carico.
          </p>
        </div>

        {/* Sets table */}
        <div className="flex flex-col gap-2">
          {/* Header row */}
          <div className="grid grid-cols-[24px_minmax(0,2fr)_56px_48px_48px_28px] gap-2 px-2 pb-1 items-end">
            {["Set", "Precedente", "kg", "reps", "RPE", ""].map((label, i) => (
              <span
                key={i}
                className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant text-center"
              >
                {label}
              </span>
            ))}
          </div>

          {sets.map((row, idx) => (
            <SetRowItem
              key={row.id}
              row={row}
              index={idx + 1}
              onChange={updateField}
              onToggleDone={toggleDone}
            />
          ))}

          <button
            type="button"
            onClick={addSet}
            className={cn(
              "mt-2 py-3 rounded-2xl",
              "flex items-center justify-center gap-1",
              "bg-surface-container/60 text-brand-container",
              "font-display text-xs font-bold tracking-widest uppercase",
              "transition-colors hover:bg-surface-container",
              "active:scale-[0.98]",
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            Aggiungi Set
          </button>
        </div>
      </div>

      {/* Sticky footer */}
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
          Termina Esercizio
        </button>
      </footer>
    </DrawerShell>
  );
}

// =============================================================================
// SetRowItem — extracted to keep the parent readable. Includes the
// brand "completed" tint when done, focused brand border on the kg input.
// =============================================================================
function SetRowItem({
  row,
  index,
  onChange,
  onToggleDone,
}: {
  row: SetRow;
  index: number;
  onChange: (id: string, field: keyof SetRow, value: string) => void;
  onToggleDone: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[24px_minmax(0,2fr)_56px_48px_48px_28px] gap-2 items-center",
        "rounded-2xl p-2",
        row.done
          ? "bg-brand-container/10 border border-brand-container/20"
          : "bg-white border border-[#c0c7d0]/30",
      )}
    >
      <span className="font-display text-sm font-semibold text-on-surface text-center tabular-nums">
        {index}
      </span>
      <span className="font-sans text-[11px] text-on-surface-variant truncate">
        {row.previous}
      </span>
      <input
        type="number"
        inputMode="decimal"
        aria-label={`kg set ${index}`}
        value={row.kg}
        onChange={(e) => onChange(row.id, "kg", e.target.value)}
        className={cn(
          "w-full h-9 rounded-lg text-center font-display text-sm font-semibold tabular-nums",
          "outline-none transition-colors",
          row.done
            ? "bg-white/80 text-on-surface border border-transparent"
            : "bg-surface text-on-surface border border-brand-container/60 focus:border-brand-container focus:ring-1 focus:ring-brand-container",
        )}
      />
      <input
        type="number"
        inputMode="decimal"
        aria-label={`reps set ${index}`}
        value={row.reps}
        onChange={(e) => onChange(row.id, "reps", e.target.value)}
        className={cn(
          "w-full h-9 rounded-lg text-center font-display text-sm font-semibold tabular-nums",
          "outline-none transition-colors",
          "bg-surface-container/60 text-on-surface border border-transparent",
          "focus:bg-white focus:border-brand-container focus:ring-1 focus:ring-brand-container",
        )}
      />
      <input
        type="number"
        inputMode="decimal"
        aria-label={`RPE set ${index}`}
        value={row.rpe}
        onChange={(e) => onChange(row.id, "rpe", e.target.value)}
        placeholder="—"
        className={cn(
          "w-full h-9 rounded-lg text-center font-display text-sm font-semibold tabular-nums",
          "outline-none transition-colors",
          "bg-surface-container/60 text-on-surface border border-transparent",
          "placeholder:text-on-surface-variant/50",
          "focus:bg-white focus:border-brand-container focus:ring-1 focus:ring-brand-container",
        )}
      />
      <button
        type="button"
        onClick={() => onToggleDone(row.id)}
        aria-label={row.done ? `Set ${index} completato` : `Segna set ${index} come completato`}
        aria-pressed={row.done}
        className={cn(
          "h-6 w-6 rounded-md flex items-center justify-center transition-colors",
          row.done
            ? "bg-brand-container text-white"
            : "border-2 border-[#c0c7d0] text-transparent hover:border-brand-container",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  );
}

export default StandardSetDrawer;
