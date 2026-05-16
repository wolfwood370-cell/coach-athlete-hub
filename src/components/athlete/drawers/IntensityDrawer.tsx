// =============================================================================
// src/components/athlete/drawers/IntensityDrawer.tsx
// =============================================================================
// Phase 8 — Intensity technique execution drawer (Drop Set variant).
//
// Adapted from intensity_execution_drawer_drop_set.html. A parent set
// with its kg/reps inputs followed by N indented "child" drops (here:
// two -20% drops). Each child is visually connected to its parent via
// an L-bracket drawn with absolute-positioned divs.
//
// The protocol badge ("Double Drop Set") and the coach edit-note card
// at the bottom are preserved. "Add Set" appends another parent group
// at the end.
// =============================================================================

import { useState } from "react";
import { Circle, FileText, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerShell } from "./DrawerShell";

interface DropRow {
  id: string;
  /** "-20% Drop" label */
  label: string;
  kg: string;
  reps: string;
  done: boolean;
}

interface IntensitySetGroup {
  id: string;
  /** Parent set index (1-based) */
  parent: {
    previous: string;
    kg: string;
    reps: string;
    done: boolean;
  };
  drops: DropRow[];
}

const INITIAL: IntensitySetGroup[] = [
  {
    id: "g1",
    parent: { previous: "15 × 12", kg: "15", reps: "12", done: false },
    drops: [
      { id: "g1-d1", label: "-20% Drop", kg: "", reps: "", done: false },
      { id: "g1-d2", label: "-20% Drop", kg: "", reps: "", done: false },
    ],
  },
];

interface IntensityDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function IntensityDrawer({ open, onClose }: IntensityDrawerProps) {
  const [groups, setGroups] = useState<IntensitySetGroup[]>(INITIAL);

  const updateParent = (
    groupId: string,
    field: "kg" | "reps",
    value: string,
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, parent: { ...g.parent, [field]: value } } : g,
      ),
    );
  };

  const toggleParentDone = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, parent: { ...g.parent, done: !g.parent.done } }
          : g,
      ),
    );
  };

  const updateDrop = (
    groupId: string,
    dropId: string,
    field: "kg" | "reps",
    value: string,
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              drops: g.drops.map((d) =>
                d.id === dropId ? { ...d, [field]: value } : d,
              ),
            }
          : g,
      ),
    );
  };

  const toggleDropDone = (groupId: string, dropId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              drops: g.drops.map((d) =>
                d.id === dropId ? { ...d, done: !d.done } : d,
              ),
            }
          : g,
      ),
    );
  };

  const addParentSet = () => {
    const newId = String(Date.now());
    setGroups((prev) => [
      ...prev,
      {
        id: newId,
        parent: { previous: "—", kg: "", reps: "", done: false },
        drops: [
          {
            id: `${newId}-d1`,
            label: "-20% Drop",
            kg: "",
            reps: "",
            done: false,
          },
          {
            id: `${newId}-d2`,
            label: "-20% Drop",
            kg: "",
            reps: "",
            done: false,
          },
        ],
      },
    ]);
  };

  return (
    <DrawerShell open={open} onClose={onClose} ariaLabel="Esecuzione drop set">
      {/* Header */}
      <header className="shrink-0 px-6 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
            C1. Machine Lateral Raise
          </h2>
          <span className="mt-2 inline-flex px-3 py-1 rounded-full bg-brand-container/10 text-brand-container font-sans text-[10px] font-bold tracking-widest uppercase">
            Protocollo · Double Drop Set
          </span>
        </div>
        <button
          type="button"
          aria-label="Info protocollo"
          className="h-10 w-10 shrink-0 rounded-full bg-surface-container flex items-center justify-center text-brand-container active:scale-95 transition-transform"
        >
          <Info className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 px-2 font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant">
          <span>Set</span>
          <span>Precedente</span>
          <span className="text-center">kg</span>
          <span className="text-center">reps</span>
          <span className="text-right pr-1">Done</span>
        </div>

        {groups.map((g, gIdx) => (
          <div key={g.id} className="flex flex-col gap-4">
            {/* Parent set */}
            <div
              className={cn(
                "grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 items-center",
                "p-2 rounded-2xl bg-white/60 border border-transparent",
                g.parent.done && "bg-brand-container/10 border-brand-container/20",
              )}
            >
              <span className="font-display text-lg font-extrabold text-brand-container text-center tabular-nums">
                {gIdx + 1}
              </span>
              <span className="text-sm text-on-surface-variant">
                {g.parent.previous}
              </span>
              <input
                type="number"
                inputMode="decimal"
                aria-label={`Parent kg set ${gIdx + 1}`}
                value={g.parent.kg}
                onChange={(e) => updateParent(g.id, "kg", e.target.value)}
                className={cn(
                  "w-full h-10 rounded-lg text-center font-display text-sm font-bold tabular-nums",
                  "bg-white border-2 border-brand-container text-brand-container",
                  "outline-none focus:ring-0",
                )}
              />
              <input
                type="number"
                inputMode="decimal"
                aria-label={`Parent reps set ${gIdx + 1}`}
                value={g.parent.reps}
                onChange={(e) => updateParent(g.id, "reps", e.target.value)}
                className={cn(
                  "w-full h-10 rounded-lg text-center font-display text-sm font-bold tabular-nums",
                  "bg-surface-container/60 text-on-surface border border-transparent",
                  "outline-none focus:ring-2 focus:ring-brand-container",
                )}
              />
              <button
                type="button"
                onClick={() => toggleParentDone(g.id)}
                aria-label={`Toggle parent set ${gIdx + 1}`}
                aria-pressed={g.parent.done}
                className="flex justify-end pr-1 text-on-surface-variant"
              >
                <Circle
                  className={cn(
                    "h-5 w-5 transition-colors",
                    g.parent.done && "fill-brand-container text-brand-container",
                  )}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Indented child drop rows */}
            {g.drops.map((d) => (
              <div key={d.id} className="ml-10 relative">
                {/* L-bracket connector — absolute lines drawn from parent edge */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[18px] -top-3 w-3 h-6 border-l-2 border-b-2 border-surface-variant rounded-bl-lg"
                />
                <div
                  className={cn(
                    "grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 items-center",
                    "p-2 rounded-2xl bg-white/40",
                  )}
                >
                  <span className="inline-flex w-fit px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-sans text-[9px] font-bold tracking-widest uppercase">
                    {d.label}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label="Drop kg"
                    value={d.kg}
                    onChange={(e) => updateDrop(g.id, d.id, "kg", e.target.value)}
                    placeholder="12"
                    className={cn(
                      "w-full h-10 rounded-lg text-center font-display text-sm font-semibold tabular-nums",
                      "bg-transparent border border-[#c0c7d0]/40 text-on-surface-variant",
                      "outline-none focus:ring-2 focus:ring-brand-container focus:border-brand-container",
                    )}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label="Drop reps"
                    value={d.reps}
                    onChange={(e) => updateDrop(g.id, d.id, "reps", e.target.value)}
                    placeholder="—"
                    className={cn(
                      "w-full h-10 rounded-lg text-center font-display text-sm font-semibold tabular-nums",
                      "bg-transparent border border-[#c0c7d0]/40 text-on-surface-variant",
                      "outline-none focus:ring-2 focus:ring-brand-container focus:border-brand-container",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => toggleDropDone(g.id, d.id)}
                    aria-label={`Toggle drop ${d.label}`}
                    aria-pressed={d.done}
                    className="flex justify-end pr-1 text-on-surface-variant/60"
                  >
                    <Circle
                      className={cn(
                        "h-5 w-5",
                        d.done && "fill-brand-container text-brand-container",
                      )}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Add Set + Coach Note */}
        <div className="pt-4 mt-2 border-t border-[#c0c7d0]/30 flex flex-col gap-4">
          <button
            type="button"
            onClick={addParentSet}
            className="self-start flex items-center gap-2 text-brand-container font-sans text-xs font-bold tracking-widest uppercase active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            Aggiungi Set
          </button>
          <div className="rounded-2xl p-4 bg-brand-container/5 flex gap-3">
            <FileText
              className="h-5 w-5 text-brand-container shrink-0 mt-0.5"
              strokeWidth={2}
              aria-hidden="true"
            />
            <p className="text-sm italic text-on-surface-variant">
              Concentrati sulla fase eccentrica controllata. Non scaricare con
              slancio nella parte bassa del ROM.
            </p>
          </div>
        </div>
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
          Termina Esercizio
        </button>
      </footer>
    </DrawerShell>
  );
}

export default IntensityDrawer;
