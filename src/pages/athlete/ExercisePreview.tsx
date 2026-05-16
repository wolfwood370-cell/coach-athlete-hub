// =============================================================================
// src/pages/athlete/ExercisePreview.tsx
// =============================================================================
// Phase 6 — Single-exercise preview page. One file, four visual variants.
//
// Variants (selected via local useState in this commit; will become a route
// param or a workout-context selector in the wiring commit):
//
//   1. "standard"   ←  exercise_preview_locked.html
//        Video poster + coach note + locked logging table with dashed
//        cells for the kg/reps inputs.
//
//   2. "intensity"  ←  intensity_protocol_preview.html
//        Hero image card + protocol breakdown (Activation + Micro-Sets
//        with a vertical branch connector) + Target Volume / RPE widgets.
//
//   3. "emom"       ←  time_based_protocol_preview_emom.html
//        EMOM badge + numbered minute-window rows ("Minuto 1, 3, 5...").
//
//   4. "isometric"  ←  timed_isometric_exercise_preview.html
//        Single card with image, big "Duration" stat row (Target / Durata
//        / Sovraccarico), coach tip.
//
// Mount: SIBLING of <AthleteLayout> at /athlete/training/exercise.
// Back affordance points to /athlete/training.
//
// All sub-components inline, mock data only.
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  Info,
  Lock,
  Megaphone,
  MoreVertical,
  Play,
  Repeat,
  Timer,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =============================================================================
// Variant type — exposed as state for in-page QA toggle.
// =============================================================================
type ExerciseType = "standard" | "intensity" | "emom" | "isometric";

const VARIANT_OPTIONS: { value: ExerciseType; label: string }[] = [
  { value: "standard", label: "Std" },
  { value: "intensity", label: "Int" },
  { value: "emom", label: "EMOM" },
  { value: "isometric", label: "Iso" },
];

// =============================================================================
// VariantToggle — small dev-style segmented control to flip between the
// four visual states. Disappears when this page is wired to real data.
// =============================================================================
function VariantToggle({
  value,
  onChange,
}: {
  value: ExerciseType;
  onChange: (next: ExerciseType) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Anteprima variante (demo)"
      className="flex items-center gap-1 p-1 rounded-full bg-surface-variant/40 border border-[#c0c7d0]/30"
    >
      {VARIANT_OPTIONS.map(({ value: v, label }) => {
        const isActive = v === value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-full",
              "font-sans text-xs font-bold tracking-wide",
              "transition-all duration-200",
              isActive
                ? "bg-brand-container text-white shadow-[0_4px_12px_rgba(34,111,163,0.25)]"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// TopBar — back + title + overflow menu.
// =============================================================================
function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40",
        "h-16 flex items-center justify-between px-4",
        "backdrop-blur-xl bg-white/85",
        "border-b border-[#c0c7d0]/40",
      )}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Torna agli allenamenti"
        className="h-10 w-10 rounded-full flex items-center justify-center text-brand-container hover:bg-surface-container/60 transition-colors active:scale-95"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </button>
      <h1 className="font-display text-lg font-bold tracking-tight text-on-surface">
        Anteprima Esercizio
      </h1>
      <button
        type="button"
        aria-label="Altre opzioni"
        className="h-10 w-10 rounded-full flex items-center justify-center text-brand-container hover:bg-surface-container/60 transition-colors active:scale-95"
      >
        <MoreVertical className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  );
}

// =============================================================================
// VideoPlaceholder — 16:9 frame with a centered Play button.
// =============================================================================
function VideoPlaceholder({ caption }: { caption: string }) {
  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-surface-container">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-brand-container/10 to-brand-container/30"
      />
      <button
        type="button"
        aria-label={`Riproduci dimostrazione: ${caption}`}
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "text-brand-container",
          "transition-transform duration-200 hover:scale-105",
        )}
      >
        <span className="h-16 w-16 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center shadow-lg">
          <Play
            className="h-7 w-7 fill-brand-container"
            strokeWidth={0}
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
  );
}

// =============================================================================
// CoachNoteCard — small left-bordered glass card used by several variants.
// =============================================================================
function CoachNoteCard({ text }: { text: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        "bg-surface-container/40 backdrop-blur-xl",
        "border-l-4 border-brand-container",
        "border border-brand-container/15",
      )}
    >
      <div className="flex items-start gap-3">
        <Megaphone
          className="h-5 w-5 text-brand-container mt-0.5 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-widest text-brand-container">
            Nota del Coach
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">{text}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// VARIANT 1 — Standard / Locked
//   Video + title + coach note + lock banner + disabled logging table.
// =============================================================================
function StandardVariant() {
  const sets = [
    { id: 1, target: "10 reps", previous: "80kg × 10" },
    { id: 2, target: "10 reps", previous: "80kg × 10" },
    { id: 3, target: "10 reps", previous: "80kg × 9" },
  ];
  return (
    <>
      <VideoPlaceholder caption="A1. Barbell Back Squat" />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface">
          A1. Barbell Back Squat
        </h2>
        <CoachNoteCard text="Concentrati sulla profondità e su una concentrica esplosiva." />
      </section>

      {/* Preview / lock banner */}
      <div
        className={cn(
          "rounded-2xl p-4",
          "bg-surface-container/40 border border-[#c0c7d0]/30",
          "flex items-center gap-3",
        )}
      >
        <Lock
          className="h-5 w-5 text-on-surface-variant"
          strokeWidth={2}
          aria-hidden="true"
        />
        <p className="text-sm text-on-surface-variant">
          Modalità anteprima. Avvia la sessione per registrare le serie.
        </p>
      </div>

      {/* Locked logging table */}
      <section
        aria-label="Tabella set (anteprima, disabilitata)"
        className="flex flex-col gap-2"
      >
        <div className="grid grid-cols-[28px_1fr_1fr_56px_56px] gap-2 px-2 pb-2 border-b border-[#c0c7d0]/25">
          {["SET", "TARGET", "PRECEDENTE", "KG", "REPS"].map((h) => (
            <span
              key={h}
              className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant text-center"
            >
              {h}
            </span>
          ))}
        </div>
        {sets.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[28px_1fr_1fr_56px_56px] gap-2 items-center px-2 py-3 bg-white/60 rounded-2xl border border-transparent"
          >
            <span className="font-sans text-xs font-semibold tabular-nums text-on-surface-variant text-center">
              {s.id}
            </span>
            <span className="text-sm text-on-surface-variant text-center">
              {s.target}
            </span>
            <span className="text-sm text-on-surface-variant text-center">
              {s.previous}
            </span>
            <div
              aria-disabled="true"
              className="bg-surface-container/40 rounded-lg p-2 text-center border border-dashed border-[#c0c7d0]/60"
            >
              <span className="text-sm text-on-surface-variant">–</span>
            </div>
            <div
              aria-disabled="true"
              className="bg-surface-container/40 rounded-lg p-2 text-center border border-dashed border-[#c0c7d0]/60"
            >
              <span className="text-sm text-on-surface-variant">–</span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

// =============================================================================
// VARIANT 2 — Intensity Protocol (Rest-Pause)
//   Hero card + Activation + Micro-Sets with branch connector + Target /
//   Intensity widgets.
// =============================================================================
function IntensityVariant() {
  return (
    <>
      <section className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
          Leg Day B
        </h2>
        <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant bg-surface-container/60 px-3 py-1 rounded-full inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          65 min
        </span>
      </section>

      {/* Protocol card */}
      <section
        className={cn(
          "rounded-3xl overflow-hidden",
          "bg-white/70 backdrop-blur-xl",
          "border border-[#c0c7d0]/30",
          "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
        )}
      >
        <VideoPlaceholder caption="C1. Seated Leg Curl" />

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] font-bold tracking-widest uppercase text-on-surface">
              Tecnica di Intensità
            </span>
            <span className="bg-brand-container text-white text-xs font-bold tracking-wide px-4 py-1 rounded-full">
              Rest-Pause
            </span>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold leading-tight text-on-surface">
              C1. Seated Leg Curl
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Isolamento · 1 serie totale (protocollo esteso)
            </p>
          </div>

          {/* Protocol breakdown */}
          <div className="rounded-2xl p-5 bg-surface-container/40 border border-[#c0c7d0]/20 flex flex-col gap-6">
            {/* Activation Set */}
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 h-6 w-6 rounded-full bg-white border border-brand-container/30 flex items-center justify-center shrink-0"
              >
                <Zap
                  className="h-3.5 w-3.5 text-brand-container fill-brand-container"
                  strokeWidth={0}
                />
              </span>
              <div>
                <h4 className="font-display text-sm font-bold text-on-surface">
                  Activation Set: 10-12 Reps @ RPE 9
                </h4>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                  Raggiungi il cedimento, poi recupera esattamente 15 secondi.
                </p>
              </div>
            </div>

            {/* Micro-Sets with branch connector */}
            <div className="relative pl-8">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-1/2 w-px bg-[#c0c7d0]/50"
              />
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 w-3 h-px bg-[#c0c7d0]/50"
              />
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 h-6 w-6 rounded-full bg-white border border-brand-container/30 flex items-center justify-center shrink-0"
                >
                  <Repeat
                    className="h-3.5 w-3.5 text-brand-container"
                    strokeWidth={2.5}
                  />
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-on-surface">
                    Micro-Sets: 3-5 Reps × 4 round
                  </h4>
                  <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                    15 secondi di recupero fra i round. Fermati quando non
                    raggiungi 3 reps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="rounded-2xl p-4 bg-brand-container/5 border border-brand-container/15 flex items-center gap-3">
            <Megaphone
              className="h-4 w-4 text-brand-container shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <p className="font-sans text-[11px] font-semibold tracking-wider uppercase text-brand-container/80">
              Mantieni tensione costante nel punto di massima contrazione.
            </p>
          </div>
        </div>
      </section>

      {/* Target / Intensity glance widgets */}
      <div className="grid grid-cols-2 gap-3">
        <section
          aria-label="Volume target"
          className="rounded-3xl p-5 bg-white/70 backdrop-blur-xl border border-[#c0c7d0]/30"
        >
          <span className="block font-sans text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
            Volume Target
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold text-on-surface tabular-nums">
              24
            </span>
            <span className="font-sans text-[11px] font-semibold text-on-surface-variant">
              REPS
            </span>
          </div>
        </section>
        <section
          aria-label="Intensità target"
          className="rounded-3xl p-5 bg-white/70 backdrop-blur-xl border border-[#c0c7d0]/30"
        >
          <span className="block font-sans text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
            Intensità
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold text-on-surface tabular-nums">
              9.5
            </span>
            <span className="font-sans text-[11px] font-semibold text-on-surface-variant">
              RPE
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

// =============================================================================
// VARIANT 3 — EMOM
//   Block badge + numbered minute-windows.
// =============================================================================
function EmomVariant() {
  const rows = [
    {
      id: "odd",
      label: "Minuti 1, 3, 5...",
      name: "15× Kettlebell Swings",
      hint: "Carico pesante. Il tempo rimanente è recupero.",
    },
    {
      id: "even",
      label: "Minuti 2, 4, 6...",
      name: "10× Burpees over the KB",
      hint: "Ritmo costante. Il tempo rimanente è recupero.",
    },
  ];

  return (
    <section
      className={cn(
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
        "flex flex-col gap-6",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-sans text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">
            Blocco di Condizionamento
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-on-surface">
            D. Engine Builder
          </h2>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 bg-brand-container text-white text-xs font-bold tracking-wide px-3 py-1.5 rounded-full">
          <Timer className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          EMOM 12'
        </span>
      </div>

      <p className="text-sm text-on-surface-variant max-w-prose">
        Lavoro metabolico alternato. Rispetta la finestra di lavoro del minuto.
      </p>

      <div className="rounded-2xl p-5 bg-surface-container/40 border border-[#c0c7d0]/20 flex flex-col gap-5">
        {rows.map((row, i) => (
          <div key={row.id}>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <span className="shrink-0 inline-flex items-center bg-white text-on-surface text-xs font-semibold px-3 py-1.5 rounded-full border border-[#c0c7d0]/30">
                {row.label}
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-on-surface leading-tight">
                  {row.name}
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">{row.hint}</p>
              </div>
            </div>
            {i < rows.length - 1 && (
              <div
                aria-hidden="true"
                className="mt-5 border-t border-dashed border-[#c0c7d0]/50"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// VARIANT 4 — Isometric
//   Big stat row (Target / Durata / Sovraccarico) + coach tip.
// =============================================================================
function IsometricVariant() {
  return (
    <section
      className={cn(
        "rounded-3xl p-6 overflow-hidden",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
        "flex flex-col gap-6",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-sans text-[10px] font-semibold tracking-widest uppercase text-on-surface">
          Fase 1: Core &amp; Stability
        </span>
        <span className="shrink-0 inline-flex items-center gap-1 bg-brand-container text-white text-xs font-bold tracking-wide px-3 py-1.5 rounded-full">
          <Timer className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Isometria
        </span>
      </div>

      <h2 className="font-display text-2xl font-bold text-on-surface">
        A1. RKC Front Plank
      </h2>

      <VideoPlaceholder caption="A1. RKC Front Plank" />

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl p-4 bg-surface-container/40 border border-[#c0c7d0]/25">
        {[
          { label: "Target", value: "3 Serie", emphasised: false },
          { label: "Durata", value: "60 secondi", emphasised: true },
          { label: "Sovraccarico", value: "Bodyweight", emphasised: false },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {s.label}
            </span>
            <span
              className={cn(
                "mt-1 font-display text-sm",
                s.emphasised
                  ? "font-bold text-brand-container"
                  : "font-semibold text-on-surface",
              )}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-start border-l-2 border-brand-container pl-4 py-1 rounded-r-lg bg-surface-container/30">
        <Info
          className="h-4 w-4 text-on-surface-variant shrink-0 mt-1"
          strokeWidth={2}
          aria-hidden="true"
        />
        <p className="text-sm italic text-on-surface-variant">
          Mantieni la retroversione del bacino e contrai i glutei al massimo.
          Non collassare con la zona lombare.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// StickyStartCTA — fixed glass bar with primary action + secondary close.
// =============================================================================
function StickyStartCTA({ onStart }: { onStart: () => void }) {
  return (
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
      <div className="max-w-lg mx-auto px-6">
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "w-full py-4 rounded-full",
            "flex items-center justify-center gap-2",
            "bg-brand-container text-white",
            "font-display text-sm font-bold uppercase tracking-widest",
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
          Avvia Esercizio
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// ExercisePreview — page composition.
// =============================================================================
export default function ExercisePreview() {
  const navigate = useNavigate();
  const [exerciseType, setExerciseType] = useState<ExerciseType>("standard");

  const handleStart = () => {
    toast.success("Esercizio avviato", {
      description: "L'esperienza di esecuzione arriverà nel prossimo step.",
    });
  };

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans antialiased pb-32">
      <TopBar onBack={() => navigate("/athlete/training")} />

      <main className="pt-20 px-5 max-w-lg mx-auto flex flex-col gap-6">
        {/* Variant toggle — demo only, removed when this page is wired
            to real workout data. */}
        <VariantToggle value={exerciseType} onChange={setExerciseType} />

        {exerciseType === "standard" && <StandardVariant />}
        {exerciseType === "intensity" && <IntensityVariant />}
        {exerciseType === "emom" && <EmomVariant />}
        {exerciseType === "isometric" && <IsometricVariant />}
      </main>

      <StickyStartCTA onStart={handleStart} />
    </div>
  );
}
