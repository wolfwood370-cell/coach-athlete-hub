// =============================================================================
// src/pages/athlete/DailyCheckin.tsx
// =============================================================================
// Phase 2 of the new Athlete App — "Daily Readiness Logging".
//
// Adapts the layout from daily_readiness_logging.html. Two glass-on-white
// cards (biofeedback + muscle soreness) stacked over a scrollable canvas,
// with a sticky glassmorphic bottom bar holding the primary "Salva" action.
//
// All state is local React state — no Supabase calls yet (Phase 3 / backend
// integration is explicitly out of scope per brief).
//
// Sub-components are inline (ScoreScaleRow / MusclePill / IntensityControl)
// so the file stays self-contained for this phase. They'll graduate to
// `src/components/athlete/` when reused.
//
// Mount point: this page is a route SIBLING of <AthleteLayout> (not a
// child) — the HTML treats it as a modal-style full-screen flow with its
// own bottom bar that replaces the standard BottomNavBar. Nesting it
// inside the layout would produce two competing bars.
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Domain types
// -----------------------------------------------------------------------------
type Score1to5 = 1 | 2 | 3 | 4 | 5;
type Intensity = "mild" | "moderate" | "severe";

interface BiofeedbackMetric {
  id: "sleep" | "energy" | "stress" | "mood" | "digestion";
  label: string;
}

interface MuscleGroup {
  id:
    | "chest"
    | "triceps"
    | "biceps"
    | "shoulders"
    | "traps"
    | "lats"
    | "lower_back"
    | "glutes"
    | "hamstrings"
    | "quads"
    | "calves";
  label: string;
}

type MetricId = BiofeedbackMetric["id"];
type MuscleId = MuscleGroup["id"];

// -----------------------------------------------------------------------------
// Static config — kept inside the file because no other surface needs it.
// -----------------------------------------------------------------------------
const BIOFEEDBACK_METRICS: readonly BiofeedbackMetric[] = [
  { id: "sleep", label: "Sonno" },
  { id: "energy", label: "Energia" },
  { id: "stress", label: "Stress" },
  { id: "mood", label: "Umore" },
  { id: "digestion", label: "Digestione" },
] as const;

const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  { id: "chest", label: "Petto" },
  { id: "triceps", label: "Tricipiti" },
  { id: "biceps", label: "Bicipiti" },
  { id: "shoulders", label: "Spalle" },
  { id: "traps", label: "Trapezi" },
  { id: "lats", label: "Dorsali" },
  { id: "lower_back", label: "Lombari" },
  { id: "glutes", label: "Glutei" },
  { id: "hamstrings", label: "Femorali" },
  { id: "quads", label: "Quadricipiti" },
  { id: "calves", label: "Polpacci" },
] as const;

const INTENSITY_OPTIONS: readonly { value: Intensity; label: string }[] = [
  { value: "mild", label: "Lieve" },
  { value: "moderate", label: "Moderato" },
  { value: "severe", label: "Forte" },
] as const;

const SCORES: readonly Score1to5[] = [1, 2, 3, 4, 5] as const;

// =============================================================================
// ScoreScaleRow — one biofeedback metric row: label + 5-button scale.
// Visually & semantically a radiogroup; single-select 1..5.
// =============================================================================
function ScoreScaleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Score1to5 | null;
  onChange: (next: Score1to5) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-on-surface-variant w-24 shrink-0">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex gap-2"
      >
        {SCORES.map((n) => {
          const isActive = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${label} ${n}`}
              onClick={() => onChange(n)}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                "font-sans text-sm font-semibold tabular-nums",
                "transition-all duration-150 active:scale-95",
                isActive
                  ? "bg-brand-container text-white shadow-md"
                  : "bg-surface text-on-surface-variant border border-surface-container hover:bg-surface-variant/40",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MusclePill — single toggle chip in the soreness picker (multi-select).
// =============================================================================
function MusclePill({
  label,
  isSelected,
  onToggle,
}: {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      className={cn(
        "px-4 py-2 rounded-full",
        "font-sans text-xs font-semibold tracking-wide",
        "transition-all duration-150 active:scale-95",
        isSelected
          ? "bg-brand-container text-white shadow-md"
          : "bg-surface text-on-surface-variant border border-surface-container hover:bg-surface-variant/40",
      )}
    >
      {label}
    </button>
  );
}

// =============================================================================
// IntensityControl — three-way segmented control for a single sore muscle.
// Renders once per selected muscle.
// =============================================================================
function IntensityControl({
  muscleLabel,
  value,
  onChange,
}: {
  muscleLabel: string;
  value: Intensity;
  onChange: (next: Intensity) => void;
}) {
  return (
    <div className="rounded-2xl p-4 bg-surface-container/70 border border-surface-container/60">
      <p className="font-sans text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant mb-3">
        Intensità · <span className="text-on-surface">{muscleLabel}</span>
      </p>
      <div
        role="radiogroup"
        aria-label={`Intensità per ${muscleLabel}`}
        className="flex rounded-full overflow-hidden border border-surface-container"
      >
        {INTENSITY_OPTIONS.map((opt, i) => {
          const isActive = value === opt.value;
          const isLast = i === INTENSITY_OPTIONS.length - 1;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 py-2.5",
                "font-sans text-xs font-semibold tracking-wide",
                "transition-colors active:bg-brand-container/10",
                !isLast && "border-r border-surface-container",
                isActive
                  ? "bg-brand-container text-white shadow-inner"
                  : "bg-white text-on-surface-variant hover:bg-surface-variant/40",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// DailyCheckin — page composition.
// =============================================================================
export default function DailyCheckin() {
  const navigate = useNavigate();

  // -- State ----------------------------------------------------------------
  // Biofeedback: per-metric 1..5 single select. Partial: a metric is "unset"
  // until the user taps a value.
  const [biofeedback, setBiofeedback] = useState<
    Partial<Record<MetricId, Score1to5>>
  >({});

  // Soreness: a muscle is present in the map iff selected. Its value is the
  // chosen intensity (defaults to "moderate" when first picked).
  const [soreness, setSoreness] = useState<
    Partial<Record<MuscleId, Intensity>>
  >({});

  // -- Handlers -------------------------------------------------------------
  const setMetric = (id: MetricId) => (value: Score1to5) => {
    setBiofeedback((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMuscle = (id: MuscleId) => () => {
    setSoreness((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = "moderate"; // sensible default — coach can verify "Forte"
      }
      return next;
    });
  };

  const setIntensity = (id: MuscleId) => (intensity: Intensity) => {
    setSoreness((prev) => ({ ...prev, [id]: intensity }));
  };

  const handleClose = () => {
    navigate("/athlete");
  };

  const handleSave = () => {
    // No Supabase write yet — log the payload preview so wiring is trivial
    // in the next commit (the shape here matches daily_readiness columns).
    // eslint-disable-next-line no-console
    console.info("[DailyCheckin] payload preview", { biofeedback, soreness });
    toast.success("Check-in salvato", {
      description: "I dati saranno sincronizzati nel prossimo step.",
    });
    navigate("/athlete");
  };

  // Selected muscles, in canonical order (to keep the intensity list stable
  // as the user toggles pills).
  const selectedMuscles = MUSCLE_GROUPS.filter(({ id }) =>
    Boolean(soreness[id]),
  );

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans antialiased pb-[120px]">
      {/* ---------------------------------------------------------------
         Top App Bar — sticky, glass, close button left, title centered
         --------------------------------------------------------------- */}
      <header
        className={cn(
          "sticky top-0 z-40",
          "backdrop-blur-xl bg-white/85",
          "border-b border-[#c0c7d0]/40",
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Chiudi check-in e torna alla dashboard"
            className={cn(
              "h-10 w-10 -ml-2 rounded-full",
              "flex items-center justify-center",
              "text-brand-container",
              "transition-colors hover:bg-surface-container/60",
              "active:scale-95",
            )}
          >
            <X className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 className="font-display text-lg font-bold tracking-tight text-on-surface">
            Readiness Mattutino
          </h1>
          {/* Right spacer to keep the title visually centered */}
          <div className="w-10 shrink-0" aria-hidden="true" />
        </div>
      </header>

      {/* ---------------------------------------------------------------
         Main scrollable canvas — two cards.
         pb-[120px] on the wrapper above clears the fixed bottom bar.
         --------------------------------------------------------------- */}
      <main className="px-5 py-6 flex flex-col gap-6 max-w-md mx-auto">
        {/* -------- Core Biofeedback card -------------------------- */}
        <section
          aria-label="Biofeedback principale"
          className={cn(
            "rounded-3xl p-6",
            "bg-white",
            "border border-surface-container/60",
            "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
            "flex flex-col gap-5",
          )}
        >
          {BIOFEEDBACK_METRICS.map(({ id, label }) => (
            <ScoreScaleRow
              key={id}
              label={label}
              value={biofeedback[id] ?? null}
              onChange={setMetric(id)}
            />
          ))}
        </section>

        {/* -------- Muscle Soreness card --------------------------- */}
        <section
          aria-label="Indolenzimento muscolare"
          className={cn(
            "rounded-3xl p-6",
            "bg-white",
            "border border-surface-container/60",
            "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
          )}
        >
          <h2 className="font-display text-2xl font-semibold tracking-tight text-on-surface mb-4">
            Indolenzimento
          </h2>

          <div
            role="group"
            aria-label="Seleziona i gruppi muscolari indolenziti"
            className="flex flex-wrap gap-2 mb-6"
          >
            {MUSCLE_GROUPS.map(({ id, label }) => (
              <MusclePill
                key={id}
                label={label}
                isSelected={Boolean(soreness[id])}
                onToggle={toggleMuscle(id)}
              />
            ))}
          </div>

          {/* Contextual intensity sub-menus — one per selected muscle.
              Renders nothing if no muscles are picked. */}
          {selectedMuscles.length > 0 && (
            <div className="flex flex-col gap-3">
              {selectedMuscles.map(({ id, label }) => (
                <IntensityControl
                  key={id}
                  muscleLabel={label}
                  value={soreness[id] ?? "moderate"}
                  onChange={setIntensity(id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ---------------------------------------------------------------
         Sticky bottom action bar — glassmorphic, holds the "Salva" CTA.
         Uses pb-safe via env() so on iPhones the button clears the
         home indicator without the layout doing math.
         --------------------------------------------------------------- */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50",
          "backdrop-blur-2xl bg-white/90",
          "border-t border-[#c0c7d0]/40",
          "rounded-t-[32px]",
          "shadow-[0_-10px_40px_rgba(80,118,142,0.1)]",
          "pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]",
        )}
      >
        <div className="max-w-md mx-auto px-6">
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              "w-full py-4 rounded-full",
              "flex items-center justify-center gap-2",
              "bg-brand-container text-white",
              "font-display text-sm font-bold uppercase tracking-widest",
              "shadow-[0_8px_20px_rgba(34,111,163,0.3)]",
              "transition-transform duration-200 active:scale-[0.98]",
              "hover:brightness-110",
            )}
          >
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}
