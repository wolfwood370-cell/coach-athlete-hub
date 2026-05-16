// =============================================================================
// src/components/athlete/drawers/IsometricDrawer.tsx
// =============================================================================
// Phase 8 — Timed isometric execution drawer.
//
// Adapted from timed_isometric_execution_drawer.html. Per-set inputs are
// +KG (overload bodyweight) and Secs (hold duration), with an inline
// "Avvia XXs" button that triggers a per-set countdown.
//
// Countdown semantics: tapping "Avvia 60s" on an active row starts a
// per-set timer that ticks down to 0; auto-stops at 0 and toggles the
// row to "completed" (filled brand check). Only one row can run at a
// time — starting another row stops the previous.
// =============================================================================

import { useEffect, useState } from "react";
import { Check, Pause, Play, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerShell } from "./DrawerShell";

interface IsoSetRow {
  id: string;
  previous: string;
  /** Bodyweight extra load (kg). 0 = pure bodyweight. */
  extraKg: string;
  secs: string;
  done: boolean;
}

const INITIAL: IsoSetRow[] = [
  { id: "1", previous: "BW × 45s", extraKg: "0", secs: "60", done: false },
  { id: "2", previous: "BW × 45s", extraKg: "", secs: "", done: false },
];

interface IsometricDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function IsometricDrawer({ open, onClose }: IsometricDrawerProps) {
  const [sets, setSets] = useState<IsoSetRow[]>(INITIAL);
  const [runningSetId, setRunningSetId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  // Reset countdown state on drawer reopen.
  useEffect(() => {
    if (!open) {
      setRunningSetId(null);
      setRemaining(0);
    }
  }, [open]);

  // Tick the active countdown.
  useEffect(() => {
    if (runningSetId === null) return undefined;
    if (remaining <= 0) {
      // Auto-complete the row when the timer hits zero.
      setSets((prev) =>
        prev.map((s) => (s.id === runningSetId ? { ...s, done: true } : s)),
      );
      setRunningSetId(null);
      return undefined;
    }
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [runningSetId, remaining]);

  const updateField = (id: string, field: keyof IsoSetRow, value: string) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const toggleDone = (id: string) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
  };

  const handleStart = (row: IsoSetRow) => {
    const secs = Number(row.secs);
    if (!Number.isFinite(secs) || secs <= 0) return;
    if (runningSetId === row.id) {
      // Pause — preserve remaining count for resume.
      setRunningSetId(null);
      return;
    }
    setRunningSetId(row.id);
    setRemaining(secs);
  };

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        previous: last?.previous ?? "BW × 45s",
        extraKg: "0",
        secs: "",
        done: false,
      },
    ]);
  };

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      ariaLabel="Esecuzione esercizio isometrico"
    >
      {/* Header */}
      <header className="shrink-0 px-6 pb-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
          A1. RKC Front Plank
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors active:scale-95"
        >
          <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5">
        {/* Column headers */}
        <div className="grid grid-cols-[28px_minmax(0,1fr)_56px_56px_88px_32px] gap-3 items-end px-2">
          {["Set", "Precedente", "+KG", "Sec", "", ""].map((label, i) => (
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

        {sets.map((row, idx) => {
          const isRunning = runningSetId === row.id;
          const isActive = idx === 0 && !row.done;
          const startLabel = isRunning
            ? `${remaining}s`
            : `Avvia ${row.secs || "—"}s`;

          return (
            <div
              key={row.id}
              className={cn(
                "grid grid-cols-[28px_minmax(0,1fr)_56px_56px_88px_32px] gap-3 items-center",
                "py-3 px-2 rounded-2xl relative overflow-hidden",
                row.done
                  ? "bg-brand-container/10"
                  : isActive
                    ? "bg-surface-container/70"
                    : "",
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-brand-container"
                />
              )}
              <span
                className={cn(
                  "font-display text-sm font-semibold tabular-nums text-center",
                  isActive || row.done ? "text-on-surface" : "text-on-surface-variant",
                )}
              >
                {idx + 1}
              </span>
              <span
                className={cn(
                  "text-sm truncate",
                  isActive || row.done ? "text-on-surface-variant" : "text-on-surface-variant/60",
                )}
              >
                {row.previous}
              </span>
              <input
                type="number"
                inputMode="decimal"
                aria-label={`+kg set ${idx + 1}`}
                value={row.extraKg}
                onChange={(e) => updateField(row.id, "extraKg", e.target.value)}
                className={cn(
                  "w-full h-10 rounded-lg text-center font-display text-sm font-semibold tabular-nums",
                  "outline-none transition-colors",
                  isActive || row.done
                    ? "bg-white border border-brand-container/50 text-on-surface focus:ring-1 focus:ring-brand-container"
                    : "bg-surface-container/40 border border-transparent text-on-surface-variant",
                )}
              />
              <input
                type="number"
                inputMode="decimal"
                aria-label={`secondi set ${idx + 1}`}
                value={row.secs}
                onChange={(e) => updateField(row.id, "secs", e.target.value)}
                className={cn(
                  "w-full h-10 rounded-lg text-center font-display text-sm font-semibold tabular-nums",
                  "outline-none transition-colors",
                  isActive || row.done
                    ? "bg-white border border-brand-container/50 text-on-surface focus:ring-1 focus:ring-brand-container"
                    : "bg-surface-container/40 border border-transparent text-on-surface-variant",
                )}
              />
              <button
                type="button"
                onClick={() => handleStart(row)}
                disabled={!isActive && !row.done && !isRunning}
                aria-label={isRunning ? "Pausa countdown" : `Avvia countdown set ${idx + 1}`}
                className={cn(
                  "h-10 px-2 rounded-lg flex items-center justify-center gap-1",
                  "font-sans text-[11px] font-bold tracking-wide tabular-nums",
                  "transition-colors active:scale-95 transition-transform",
                  isActive
                    ? "bg-brand-container/15 text-brand-container hover:bg-brand-container/25"
                    : "bg-surface-container/50 text-on-surface-variant/60 cursor-not-allowed",
                )}
              >
                {isRunning ? (
                  <Pause
                    className="h-3.5 w-3.5 fill-current"
                    strokeWidth={0}
                    aria-hidden="true"
                  />
                ) : (
                  <Play
                    className="h-3.5 w-3.5 fill-current"
                    strokeWidth={0}
                    aria-hidden="true"
                  />
                )}
                <span className="whitespace-nowrap">{startLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleDone(row.id)}
                aria-label={`Set ${idx + 1} ${row.done ? "completato" : "da completare"}`}
                aria-pressed={row.done}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                  row.done
                    ? "bg-brand-container text-white"
                    : "border-2 border-[#c0c7d0] text-transparent hover:border-brand-container",
                )}
              >
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addSet}
          className="self-start flex items-center gap-2 px-2 py-2 text-brand-container font-sans text-[11px] font-bold tracking-widest uppercase active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          Aggiungi Set
        </button>
      </div>

      <footer className="shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] border-t border-[#c0c7d0]/30 bg-white/85 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "w-full h-14 rounded-full",
            "bg-brand-container text-white",
            "font-display text-sm font-bold tracking-widest uppercase",
            "shadow-[0_8px_20px_rgba(34,111,163,0.3)]",
            "transition-all duration-200",
            "hover:brightness-110 active:scale-[0.98]",
          )}
        >
          Termina Esercizio
        </button>
      </footer>
    </DrawerShell>
  );
}

export default IsometricDrawer;
