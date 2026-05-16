// =============================================================================
// src/components/athlete/drawers/AmrapDrawer.tsx
// =============================================================================
// Phase 8 — AMRAP / Metcon execution drawer.
//
// Adapted from amrap_execution_drawer.html. Large countdown hero with
// pause/resume + restart + add-round controls, the movement task list,
// and the post-workout score logging (rounds + extra reps).
//
// Countdown uses local setInterval; cleanup on unmount and pause. The
// total cap is mocked at 12 minutes (720s) to match the HTML reference.
// =============================================================================

import { useEffect, useState } from "react";
import { Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerShell } from "./DrawerShell";

const TOTAL_SECONDS_DEFAULT = 12 * 60; // 12-minute AMRAP

const MOVEMENTS = [
  "10× Pull-ups",
  "20× Push-ups",
  "30× Air Squats",
] as const;

interface AmrapDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Override the AMRAP duration (seconds). */
  totalSeconds?: number;
}

function formatMMSS(s: number): string {
  const safe = Math.max(0, Math.floor(s));
  const m = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function AmrapDrawer({
  open,
  onClose,
  totalSeconds = TOTAL_SECONDS_DEFAULT,
}: AmrapDrawerProps) {
  // Remaining seconds counts DOWN; starts at totalSeconds.
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(true);
  const [rounds, setRounds] = useState("");
  const [extraReps, setExtraReps] = useState("");

  // Reset state on drawer reopen — keep semantics clean for QA.
  useEffect(() => {
    if (open) {
      setRemaining(totalSeconds);
      setIsPaused(true);
      setRounds("");
      setExtraReps("");
    }
  }, [open, totalSeconds]);

  // Countdown — ticks while !isPaused, stops at zero.
  useEffect(() => {
    if (!open || isPaused) return undefined;
    if (remaining <= 0) return undefined;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsPaused(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, isPaused, remaining]);

  const handleAddRound = () => {
    const n = Number(rounds || 0);
    setRounds(String(Number.isFinite(n) ? n + 1 : 1));
  };

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      ariaLabel="Sessione AMRAP"
      maxHeightClassName="max-h-[92vh]"
    >
      {/* Header */}
      <header className="shrink-0 px-6 pb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
            AMRAP · Metcon
          </h2>
          <p className="mt-0.5 font-sans text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant">
            12 minuti · giri totali
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="h-10 w-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors active:scale-95"
        >
          <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-7">
        {/* Hero countdown */}
        <div className="flex flex-col items-center gap-1 pt-3">
          <span
            role="timer"
            aria-live="off"
            className="font-display text-7xl font-black tabular-nums tracking-tighter leading-none text-brand-container"
          >
            {formatMMSS(remaining)}
          </span>
          <span className="mt-2 font-sans text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant">
            Tempo rimanente
          </span>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-5">
          <button
            type="button"
            onClick={() => {
              setRemaining(totalSeconds);
              setIsPaused(true);
            }}
            aria-label="Reset timer"
            className="h-14 w-14 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-variant/60 transition-colors active:scale-95"
          >
            <RotateCcw className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? "Avvia" : "Pausa"}
            className={cn(
              "h-20 w-20 rounded-full",
              "bg-on-surface text-white",
              "flex items-center justify-center",
              "shadow-[0_8px_24px_rgba(0,30,45,0.25)]",
              "transition-all duration-200 active:scale-95 hover:brightness-110",
            )}
          >
            {isPaused ? (
              <Play
                className="h-9 w-9 fill-white ml-1"
                strokeWidth={0}
                aria-hidden="true"
              />
            ) : (
              <Pause
                className="h-9 w-9 fill-white"
                strokeWidth={0}
                aria-hidden="true"
              />
            )}
          </button>
          <button
            type="button"
            onClick={handleAddRound}
            aria-label="Aggiungi un giro completato"
            className="h-14 w-14 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-variant/60 transition-colors active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {/* Movements */}
        <section
          aria-label="Movimenti"
          className="rounded-3xl p-5 bg-white border border-[#c0c7d0]/30"
        >
          <h3 className="font-sans text-[11px] font-bold tracking-widest uppercase text-on-surface-variant mb-3 pb-2 border-b border-surface-container">
            Movimenti
          </h3>
          <ul className="flex flex-col gap-3">
            {MOVEMENTS.map((m) => (
              <li key={m} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-brand-container"
                />
                <span className="font-display text-base font-semibold text-on-surface">
                  {m}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Score logging */}
        <section aria-label="Punteggio finale" className="flex flex-col gap-3">
          <h3 className="font-sans text-[11px] font-bold tracking-widest uppercase text-on-surface-variant pl-1">
            Punteggio
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-surface-container/60 p-4 flex flex-col gap-1 focus-within:ring-2 focus-within:ring-brand-container/40 transition">
              <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant">
                Giri
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent border-none font-display text-3xl font-bold tabular-nums text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
              />
            </label>
            <label className="rounded-2xl bg-surface-container/60 p-4 flex flex-col gap-1 focus-within:ring-2 focus-within:ring-brand-container/40 transition">
              <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant">
                Reps extra
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={extraReps}
                onChange={(e) => setExtraReps(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent border-none font-display text-3xl font-bold tabular-nums text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
              />
            </label>
          </div>
        </section>
      </div>

      <footer className="shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] border-t border-[#c0c7d0]/30 bg-white/85 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "w-full h-14 rounded-full",
            "bg-brand-container text-white",
            "font-display text-base font-bold tracking-wide",
            "shadow-[0_8px_20px_rgba(34,111,163,0.3)]",
            "transition-all duration-200",
            "hover:brightness-110 active:scale-[0.98]",
          )}
        >
          Termina e Salva Punteggio
        </button>
      </footer>
    </DrawerShell>
  );
}

export default AmrapDrawer;
