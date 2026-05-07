import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Check, Plus, FileEdit, Loader2 } from "lucide-react";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { useExerciseHistory } from "@/hooks/useExerciseHistory";
import { useSetMutation } from "@/hooks/useSetMutation";
import { useActiveSessionStore } from "@/stores/useActiveSessionStore";
import type { WorkoutStructureExercise } from "@/types/database";

interface SetRow {
  id: string;
  /** Display number for parent (e.g. "1"); empty for children */
  label: string;
  /** Indent depth: 0 = parent, 1+ = child drop set */
  depth: number;
  /** Index used for persistence */
  setIndex: number;
  prev: string;
  kg: string;
  reps: string;
  completed: boolean;
}

function exerciseKey(ex: WorkoutStructureExercise | null, idx: number): string {
  return ex?.id ?? `${ex?.name ?? "exercise"}-${idx}`;
}

function detectDropChildren(ex: WorkoutStructureExercise | null): number {
  const text = `${ex?.notes ?? ""} ${ex?.load ?? ""} ${ex?.name ?? ""}`.toLowerCase();
  if (text.includes("doppio drop") || text.includes("double drop")) return 2;
  if (text.includes("drop")) return 1;
  return 0;
}

function detectProtocolLabel(ex: WorkoutStructureExercise | null): string | null {
  const drops = detectDropChildren(ex);
  if (drops === 2) return "Protocollo: Doppio Drop Set";
  if (drops === 1) return "Protocollo: Drop Set";
  return null;
}

export default function ExerciseExecution() {
  const navigate = useNavigate();
  const { workout, isLoading } = useTodaysWorkout();
  const currentIndex = useActiveSessionStore((s) => s.currentExerciseIndex);
  const sessionLogs = useActiveSessionStore((s) => s.sessionLogs);
  const setMutation = useSetMutation();

  const exercise: WorkoutStructureExercise | null = useMemo(() => {
    const list = workout?.structure ?? [];
    if (!list.length) return null;
    return list[Math.min(currentIndex, list.length - 1)] ?? null;
  }, [workout?.structure, currentIndex]);

  const exId = useMemo(() => exerciseKey(exercise, currentIndex), [exercise, currentIndex]);
  const plannedSets = exercise?.sets ?? 4;
  const childCount = detectDropChildren(exercise);
  const protocolLabel = detectProtocolLabel(exercise);

  const exerciseNames = useMemo(
    () => (exercise?.name ? [exercise.name] : []),
    [exercise?.name]
  );
  const { data: historyMap } = useExerciseHistory(exerciseNames);
  const lastPrev = exercise?.name ? historyMap?.[exercise.name] : null;
  const prevLabel = lastPrev ? `${lastPrev.weight_kg} x ${lastPrev.reps}` : "—";

  const [rows, setRows] = useState<SetRow[]>([]);

  useEffect(() => {
    if (!exercise) return;
    const stored = sessionLogs[exId] ?? [];
    const rowsPerParent = 1 + childCount;
    const built: SetRow[] = [];
    for (let p = 0; p < plannedSets; p++) {
      for (let c = 0; c <= childCount; c++) {
        const setIndex = p * rowsPerParent + c;
        const log = stored.find((l) => l.setIndex === setIndex);
        built.push({
          id: `${p}-${c}`,
          label: c === 0 ? String(p + 1) : "",
          depth: c === 0 ? 0 : 1,
          setIndex,
          prev: c === 0 ? prevLabel : "—",
          kg: log?.actualKg ?? "",
          reps: log?.actualReps ?? "",
          completed: log?.completed ?? false,
        });
      }
    }
    setRows(built);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exId, plannedSets, childCount, prevLabel]);

  const onField = (
    rowId: string,
    field: "kg" | "reps"
  ) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));
    const target = rows.find((r) => r.id === rowId);
    if (!target) return;
    setMutation.mutate({
      exerciseId: exId,
      setIndex: target.setIndex,
      field: field === "kg" ? "actualKg" : "actualReps",
      value,
    });
  };

  const onToggle = (rowId: string) => {
    const target = rows.find((r) => r.id === rowId);
    if (!target) return;
    const next = !target.completed;
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, completed: next } : r)));
    setMutation.mutate({
      exerciseId: exId,
      setIndex: target.setIndex,
      field: "completed",
      value: next,
    });
  };

  const onAddSet = () => {
    setRows((prev) => {
      const lastParentNum = prev.filter((r) => r.depth === 0).length;
      const baseIndex = (prev[prev.length - 1]?.setIndex ?? -1) + 1;
      const additions: SetRow[] = [];
      for (let c = 0; c <= childCount; c++) {
        additions.push({
          id: `new-${baseIndex + c}`,
          label: c === 0 ? String(lastParentNum + 1) : "",
          depth: c === 0 ? 0 : 1,
          setIndex: baseIndex + c,
          prev: c === 0 ? prevLabel : "—",
          kg: "",
          reps: "",
          completed: false,
        });
      }
      return [...prev, ...additions];
    });
  };

  const title = exercise?.name
    ? `${String.fromCharCode(65 + currentIndex)}1. ${exercise.name}`
    : isLoading
    ? "Caricamento..."
    : "Esercizio";

  const grid = "grid grid-cols-[3rem_2fr_1.5fr_1.5fr_3rem] gap-3";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/10 backdrop-blur-[2px] z-[60]"
        onClick={() => navigate(-1)}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-[40px] rounded-t-3xl z-[70] shadow-[0_-10px_40px_rgba(80,118,142,0.1)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex flex-col items-center pt-3 pb-6 px-6">
          <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mb-6" />
          <div className="w-full flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl font-bold text-on-surface leading-tight">
                {isLoading ? (
                  <span className="inline-flex items-center gap-2 text-on-surface-variant">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Caricamento...
                  </span>
                ) : (
                  title
                )}
              </h2>
              {protocolLabel && (
                <span className="inline-flex px-3 py-1 mt-2 rounded-full bg-surface-container-high text-primary-container font-semibold text-[10px] uppercase tracking-wider">
                  {protocolLabel}
                </span>
              )}
            </div>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0"
              aria-label="Info esercizio"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-4">
          {/* Headers */}
          <div className={`${grid} mb-4 text-secondary font-semibold text-[10px] uppercase tracking-widest px-2`}>
            <span>Set</span>
            <span>Precedente</span>
            <span className="text-center">Kg</span>
            <span className="text-center">Reps</span>
            <span className="text-right">Fatto</span>
          </div>

          {/* Rows grouped */}
          <div className="space-y-3">
            {groupRows(rows).map((group, gi) => (
              <div key={gi} className="space-y-1.5">
                {/* Parent */}
                <div className={`${grid} items-center bg-white/50 p-2 rounded-xl`}>
                  <span className="font-display text-lg font-extrabold text-primary text-center">
                    {group.parent.label}
                  </span>
                  <span className="text-sm font-medium text-on-surface-variant truncate">
                    {group.parent.prev}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={group.parent.kg}
                    onChange={onField(group.parent.id, "kg")}
                    placeholder="0"
                    className="w-full bg-white border-2 border-primary-container text-primary font-bold text-center rounded-lg h-10 outline-none focus:ring-2 focus:ring-primary-container/40"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={group.parent.reps}
                    onChange={onField(group.parent.id, "reps")}
                    placeholder="0"
                    className="w-full bg-white border-2 border-primary-container text-primary font-bold text-center rounded-lg h-10 outline-none focus:ring-2 focus:ring-primary-container/40"
                  />
                  <button
                    onClick={() => onToggle(group.parent.id)}
                    className={`justify-self-end w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      group.parent.completed
                        ? "bg-primary-container text-white shadow-sm"
                        : "border-2 border-outline-variant text-transparent hover:border-primary-container"
                    }`}
                    aria-label="Completa set"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </button>
                </div>

                {/* Children with L-bracket */}
                {group.children.map((child, ci) => (
                  <div key={child.id} className="relative pl-6">
                    {/* L-bracket */}
                    <div
                      className="absolute left-3 top-0 w-3 border-l-2 border-b-2 border-outline-variant/50 rounded-bl-md"
                      style={{ height: ci === group.children.length - 1 ? "50%" : "100%" }}
                    />
                    <div className={`${grid} items-center bg-white/30 p-2 rounded-xl`}>
                      <span className="text-xs font-semibold text-on-surface-variant text-center uppercase tracking-wider">
                        Drop
                      </span>
                      <span className="text-xs text-on-surface-variant truncate">
                        {child.prev}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={child.kg}
                        onChange={onField(child.id, "kg")}
                        placeholder="0"
                        className="w-full bg-white border border-outline-variant text-on-surface text-center rounded-lg h-9 outline-none focus:ring-2 focus:ring-primary-container/40"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={child.reps}
                        onChange={onField(child.id, "reps")}
                        placeholder="0"
                        className="w-full bg-white border border-outline-variant text-on-surface text-center rounded-lg h-9 outline-none focus:ring-2 focus:ring-primary-container/40"
                      />
                      <button
                        onClick={() => onToggle(child.id)}
                        className={`justify-self-end w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          child.completed
                            ? "bg-primary-container text-white shadow-sm"
                            : "border-2 border-outline-variant text-transparent hover:border-primary-container"
                        }`}
                        aria-label="Completa drop set"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Add Set */}
          <button
            onClick={onAddSet}
            className="flex items-center gap-1.5 px-4 py-2 text-primary font-bold text-xs uppercase tracking-wider hover:bg-surface-container-low rounded-full transition-colors"
          >
            <Plus size={16} />
            Aggiungi Set
          </button>

          {/* Coach Notes (collapsible look) */}
          {exercise?.notes && (
            <div className="bg-surface-container-low rounded-xl p-4 border-l-4 border-primary-container">
              <div className="text-[10px] text-secondary uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-2">
                <FileEdit className="w-3.5 h-3.5" />
                Note del Coach
              </div>
              <p className="text-sm text-on-surface leading-relaxed">{exercise.notes}</p>
            </div>
          )}
        </div>

        {/* Sticky bottom action */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white/95 to-transparent">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-primary-container text-white font-display font-bold text-sm rounded-2xl uppercase tracking-wider shadow-lg active:scale-[0.99] transition-transform"
          >
            Termina Esercizio
          </button>
        </div>
      </div>
    </>
  );
}

function groupRows(rows: SetRow[]): { parent: SetRow; children: SetRow[] }[] {
  const groups: { parent: SetRow; children: SetRow[] }[] = [];
  for (const r of rows) {
    if (r.depth === 0) {
      groups.push({ parent: r, children: [] });
    } else if (groups.length) {
      groups[groups.length - 1].children.push(r);
    }
  }
  return groups;
}
