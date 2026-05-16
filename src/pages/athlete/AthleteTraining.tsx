// =============================================================================
// src/pages/athlete/AthleteTraining.tsx
// =============================================================================
// Phase 5 of the new Athlete App — Training Hub.
//
// Synthesises the two reference HTML files (daily_training_hub_hybrid.html
// for the diary surface + workout_overview_hub_preview.html for the
// blueprint detail) into a single "Diario / Metriche" page.
//
// Surface:
//   - Page header (eyebrow + Manrope title).
//   - Diario / Metriche pill segmented control (useState toggle).
//   - Mon-Sun micro-calendar strip computed from today's date.
//   - Diario view:
//       1. Hero workout card (glass, left brand border, eyebrow badge,
//          meta with Clock + Zap lucide icons).
//       2. Glance cards grid: weekly load (mini bar chart in pure CSS),
//          readiness chip (mini ring + label).
//       3. Workout blueprint: numbered phases ("Fase 1: ...") with the
//          dashed vertical guide line and a glass card per exercise.
//          Main-session exercises get a thin primary left-border + a
//          letter code prefix (A1, B1, ...).
//   - Metriche view: placeholder card pointing to /athlete/readiness
//     and noting that the dedicated metrics surface is in progress.
//   - Sticky bottom "Inizia Sessione" CTA at bottom-24 — sits above the
//     global BottomNavBar (which lives in <AthleteLayout> and uses
//     bottom-0). pb-32 on the content wrapper guarantees the last
//     blueprint exercise is fully scrollable above the CTA.
//
// Mount: this page is a CHILD route of <AthleteLayout> (already wired in
// App.tsx as /athlete/training). The BottomNavBar from the layout
// remains visible — that's intentional, the tab IS Training.
//
// All sub-components are inline. All data is mock; backend wiring lands
// in the follow-up commit.
// =============================================================================

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  MoreHorizontal,
  Play,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAthleteWorkoutStore } from "@/stores/useAthleteWorkoutStore";

// =============================================================================
// Domain types & mocks
// =============================================================================
type View = "diario" | "metriche";

interface Exercise {
  id: string;
  /** Optional letter code: "A1", "B1" — only on main-session exercises. */
  code?: string;
  name: string;
  /** Free-form scheme string: "4 Serie × 6-8 Reps" or "60s" */
  scheme: string;
}

interface Phase {
  id: "movement_prep" | "main_session" | "cooldown";
  /** Italian phase name */
  name: string;
  /** When true the exercises render with a primary left-border accent. */
  emphasised: boolean;
  exercises: Exercise[];
}

const TODAY_WORKOUT: {
  badge: string;
  title: string;
  durationMin: number;
  rpeTarget: number;
  phases: Phase[];
} = {
  badge: "Main Workout",
  title: "Lower Body Power & Hypertrophy",
  durationMin: 60,
  rpeTarget: 8,
  phases: [
    {
      id: "movement_prep",
      name: "Movement Prep",
      emphasised: false,
      exercises: [
        { id: "1", name: "90/90 Stretch", scheme: "2 min" },
        { id: "2", name: "RKC Front Plank", scheme: "60s" },
        { id: "3", name: "Bird Dog", scheme: "10 reps" },
      ],
    },
    {
      id: "main_session",
      name: "Main Session",
      emphasised: true,
      exercises: [
        {
          id: "a1",
          code: "A1",
          name: "Barbell Back Squat",
          scheme: "4 Serie × 6-8 Reps",
        },
        {
          id: "b1",
          code: "B1",
          name: "Romanian Deadlift",
          scheme: "3 Serie × 10 Reps",
        },
        {
          id: "c1",
          code: "C1",
          name: "Bulgarian Split Squat",
          scheme: "3 Serie × 12 Reps",
        },
      ],
    },
  ],
};

const WEEKLY_LOAD = {
  totalKg: 12_450,
  daily: [40, 60, 50, 85, 75], // mini bar chart heights (%)
};

const READINESS = {
  scorePercent: 85,
  label: "Ottima",
};

// =============================================================================
// useWeekDays — Mon-Sun strip derived from today (Italian day initials).
// =============================================================================
function useWeekDays() {
  return useMemo(() => {
    const today = new Date();
    // Monday-anchored offset: getDay() returns 0=Sun..6=Sat. We want 0=Mon..6=Sun.
    const todayMondayIdx = (today.getDay() + 6) % 7;
    const initials = ["L", "M", "M", "G", "V", "S", "D"] as const;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - todayMondayIdx + i);
      return {
        label: initials[i],
        date: d.getDate(),
        isToday: i === todayMondayIdx,
      };
    });
  }, []);
}

// =============================================================================
// PageHeader — eyebrow + title (non-sticky to keep the canvas tall).
// =============================================================================
function PageHeader() {
  return (
    <header className="pt-2 pb-1">
      <span className="font-display text-xs font-semibold tracking-widest uppercase text-brand-container">
        Allenamento
      </span>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-on-surface">
        Allenamento odierno
      </h1>
    </header>
  );
}

// =============================================================================
// ViewSwitcher — pill segmented control between Diario & Metriche.
// =============================================================================
function ViewSwitcher({
  view,
  onChange,
}: {
  view: View;
  onChange: (next: View) => void;
}) {
  const tabs: { id: View; label: string }[] = [
    { id: "diario", label: "Diario" },
    { id: "metriche", label: "Metriche" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Vista training"
      className="flex items-center gap-1 p-1 rounded-full bg-surface-variant/40 border border-[#c0c7d0]/30"
    >
      {tabs.map(({ id, label }) => {
        const isActive = view === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={cn(
              "flex-1 py-2 px-4 rounded-full",
              "font-display text-sm font-bold tracking-wide",
              "transition-all duration-200",
              isActive
                ? "bg-white text-on-surface shadow-[0_4px_12px_rgba(80,118,142,0.08)]"
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
// WeekStrip — 7-day Mon..Sun row with today highlighted.
// =============================================================================
function WeekStrip() {
  const days = useWeekDays();
  return (
    <div
      role="group"
      aria-label="Settimana corrente"
      className="flex justify-between items-center py-2"
    >
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span
            className={cn(
              "font-sans text-[11px] font-semibold uppercase tracking-wider",
              d.isToday ? "text-brand-container" : "text-on-surface-variant",
            )}
          >
            {d.label}
          </span>
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "font-display font-bold tabular-nums text-sm",
              d.isToday
                ? "bg-brand-container text-white shadow-[0_4px_14px_rgba(34,111,163,0.35)]"
                : "text-on-surface-variant",
            )}
            aria-current={d.isToday ? "date" : undefined}
          >
            {d.date}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// HeroWorkoutCard — glass card, left brand border, badge + title + meta.
// =============================================================================
function HeroWorkoutCard() {
  return (
    <section
      aria-label="Allenamento principale di oggi"
      className={cn(
        "relative overflow-hidden",
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "border-l-4 border-l-brand-container",
        "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-container/8 to-transparent"
      />
      <div className="relative z-10 flex flex-col gap-4">
        <span className="self-start font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-container bg-brand-container/10 px-2 py-1 rounded-full">
          {TODAY_WORKOUT.badge}
        </span>
        <h2 className="font-display text-xl font-semibold leading-tight text-on-surface">
          {TODAY_WORKOUT.title}
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-xs font-semibold">
              {TODAY_WORKOUT.durationMin} min stimati
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-xs font-semibold">
              RPE target: {TODAY_WORKOUT.rpeTarget}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// GlanceCards — 2-col grid: Weekly Load + Readiness.
// =============================================================================
function GlanceCards() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Weekly load card with mini bar chart */}
      <section
        aria-label="Carico settimanale"
        className={cn(
          "rounded-3xl p-5",
          "bg-white/70 backdrop-blur-xl",
          "border border-[#c0c7d0]/30",
          "flex flex-col justify-between gap-3 min-h-[144px]",
        )}
      >
        <div className="flex items-start justify-between">
          <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant">
            Carico Sett.
          </span>
          <BarChart3
            className="h-4 w-4 text-on-surface-variant"
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
        <p className="font-display text-xl font-bold tabular-nums text-on-surface leading-none">
          {WEEKLY_LOAD.totalKg.toLocaleString("it-IT")} kg
        </p>
        <div
          aria-hidden="true"
          className="w-full h-8 flex items-end gap-1 px-1 py-1 rounded-xl bg-surface-container/40"
        >
          {WEEKLY_LOAD.daily.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t-sm",
                i === WEEKLY_LOAD.daily.length - 1
                  ? "bg-brand-container"
                  : "bg-brand-container/40",
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </section>

      {/* Readiness card with mini ring */}
      <section
        aria-label="Prontezza"
        className={cn(
          "rounded-3xl p-5",
          "bg-white/70 backdrop-blur-xl",
          "border border-[#c0c7d0]/30",
          "flex flex-col justify-between gap-3 min-h-[144px]",
        )}
      >
        <div className="flex items-start justify-between">
          <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant">
            Prontezza
          </span>
          <MiniReadinessRing percent={READINESS.scorePercent} />
        </div>
        <p className="font-display text-xl font-bold text-on-surface leading-none">
          {READINESS.label}
        </p>
        <Link
          to="/athlete/readiness"
          className="self-start px-2 py-0.5 rounded-full bg-brand-container/10 text-brand-container font-sans text-[10px] font-bold tabular-nums"
        >
          {READINESS.scorePercent}% Score
        </Link>
      </section>
    </div>
  );
}

// =============================================================================
// MiniReadinessRing — tiny SVG ring used inside the glance card.
// =============================================================================
function MiniReadinessRing({ percent }: { percent: number }) {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - safe / 100);
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 36 36"
      className="-rotate-90"
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#c5e7ff"
        strokeWidth="4"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#226fa3"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

// =============================================================================
// PhaseHeader + ExerciseCard + WorkoutBlueprint
// =============================================================================
function PhaseHeader({ index, name }: { index: number; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-7 w-7 rounded-full bg-surface-container flex items-center justify-center font-display text-xs font-bold text-on-surface tabular-nums"
      >
        {index}
      </span>
      <h3 className="font-display text-base font-semibold text-on-surface">
        Fase {index}: {name}
      </h3>
    </div>
  );
}

/**
 * Whole card is a button — tapping it navigates to the exercise preview
 * with the exercise payload passed via route state, so the preview page
 * can show the right protocol/numbers without re-fetching. The inner
 * MoreHorizontal action is downgraded to a non-interactive span to
 * avoid nested interactive elements.
 */
function ExerciseCard({
  exercise,
  emphasised,
  onSelect,
}: {
  exercise: Exercise;
  emphasised: boolean;
  onSelect: (ex: Exercise) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      aria-label={`Apri anteprima ${exercise.code ? exercise.code + ". " : ""}${exercise.name}`}
      className={cn(
        "relative overflow-hidden w-full text-left",
        "rounded-2xl p-4",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "transition-transform active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-container/40",
      )}
    >
      {emphasised && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-1 bg-brand-container"
        />
      )}
      <div className={cn("flex items-start justify-between gap-3", emphasised && "pl-2")}>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold text-on-surface leading-snug">
            {exercise.code && (
              <span className="text-brand-container font-bold mr-1.5">
                {exercise.code}.
              </span>
            )}
            {exercise.name}
          </p>
          <p className="mt-1 font-sans text-xs text-on-surface-variant">
            {exercise.scheme}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-on-surface-variant/70"
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
    </button>
  );
}

function WorkoutBlueprint({
  onSelectExercise,
}: {
  onSelectExercise: (ex: Exercise) => void;
}) {
  return (
    <section aria-label="Struttura allenamento" className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-bold text-on-surface">
          Fasi dell'Allenamento
        </h2>
        <ChevronsUpDown
          className="h-4 w-4 text-on-surface-variant"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      {TODAY_WORKOUT.phases.map((phase, idx) => (
        <div key={phase.id} className="flex flex-col gap-3">
          <PhaseHeader index={idx + 1} name={phase.name} />
          {/* Indented vertical guide rail */}
          <div className="flex flex-col gap-2 pl-4 ml-3 border-l-2 border-surface-container">
            {phase.exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                emphasised={phase.emphasised}
                onSelect={onSelectExercise}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// =============================================================================
// MetricheView — placeholder for the secondary tab.
// =============================================================================
function MetricheView() {
  return (
    <section
      aria-label="Metriche training — in arrivo"
      className={cn(
        "rounded-3xl p-8",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "flex flex-col items-center justify-center text-center gap-3",
        "min-h-[240px]",
      )}
    >
      <div className="h-12 w-12 rounded-full bg-brand-container/10 flex items-center justify-center">
        <Activity
          className="h-6 w-6 text-brand-container"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
      <p className="font-display text-base font-semibold text-on-surface">
        Le tue metriche in arrivo
      </p>
      <p className="text-sm text-on-surface-variant max-w-[280px]">
        Volume, intensità e progressione settimanale saranno qui dopo le prime
        sessioni completate.
      </p>
      <Link
        to="/athlete/readiness"
        className={cn(
          "mt-2 inline-flex items-center gap-1.5",
          "font-display text-xs font-semibold text-brand-container",
          "hover:underline",
        )}
      >
        Intanto, vedi la Readiness
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </section>
  );
}

// =============================================================================
// StickyStartCTA — fixed bar that floats above the global BottomNavBar.
// Position: bottom-24 (96px) clears the nav (which is ~80px tall at bottom-0)
// with a 16px breathing gap. z-40 sits below the nav (z-50) so the nav is
// always the topmost interactive layer.
// =============================================================================
function StickyStartCTA({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed bottom-24 inset-x-0 z-40 px-5 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "w-full py-4 rounded-full",
            "flex items-center justify-center gap-2",
            "bg-brand-container text-white",
            "backdrop-blur-xl",
            "font-display text-sm font-bold uppercase tracking-widest",
            "shadow-[0_10px_30px_rgba(34,111,163,0.35)]",
            "transition-all duration-200 active:scale-[0.98]",
            "hover:brightness-110",
          )}
        >
          <Play
            className="h-5 w-5 fill-white"
            strokeWidth={0}
            aria-hidden="true"
          />
          Inizia Sessione
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// AthleteTraining — page composition.
// =============================================================================
export default function AthleteTraining() {
  const [view, setView] = useState<View>("diario");
  const navigate = useNavigate();
  // Pull only the action — we don't subscribe to state that we don't
  // read here, which keeps the page from re-rendering on every tick.
  const startSession = useAthleteWorkoutStore((s) => s.startSession);

  /** Booting handler for the bottom "Inizia Sessione" CTA.
   *  Stamps a fresh session in the store and jumps to the full-screen
   *  active workout overlay. */
  const handleStart = () => {
    startSession();
    navigate("/athlete/active-workout");
  };

  /** Per-exercise card tap → exercise preview. We pass the picked
   *  exercise via route state so the preview page can hydrate without
   *  re-fetching. The preview component will read it from
   *  `useLocation().state` once it is updated to consume real data. */
  const handleSelectExercise = (exercise: Exercise) => {
    navigate("/athlete/exercise-preview", { state: { exercise } });
  };

  return (
    <>
      {/* pb-32 reserves bottom space for the sticky CTA + global nav so the
          last blueprint exercise is reachable without overlap. */}
      <div className="flex flex-col gap-6 pb-32">
        <PageHeader />
        <ViewSwitcher view={view} onChange={setView} />
        <WeekStrip />

        {view === "diario" ? (
          <>
            <HeroWorkoutCard />
            <GlanceCards />
            <WorkoutBlueprint onSelectExercise={handleSelectExercise} />
          </>
        ) : (
          <MetricheView />
        )}
      </div>

      <StickyStartCTA onStart={handleStart} />
    </>
  );
}
