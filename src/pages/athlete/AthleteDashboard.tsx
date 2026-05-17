// =============================================================================
// src/pages/athlete/AthleteDashboard.tsx
// =============================================================================
// Phase 1 of the new Athlete App — "Dense Dashboard".
//
// Adapts the layout from athlete_home_dashboard_dense.html to React, using:
//   - the project's existing Tailwind tokens (brand / surface / on-surface),
//   - lucide-react icons in place of Material Symbols,
//   - inline sub-components (ReadinessRing, MetricRow, ReadinessCard,
//     NextWorkoutCard, Header) so the file is fully self-contained and
//     doesn't create new module surface area before the data layer lands.
//
// Strict deviations from the reference HTML:
//   - "LUMINA" brand mark → "NC Performance"
//   - Avatar moved from top-left to top-right (per brief)
//   - "Today's Focus" card relabelled "Prossimo Allenamento"; CTA text
//     translated to "Inizia Sessione"; mock title "Forza Lower Body"
//   - Notifications button dropped (brief asks only for app name + avatar)
//   - Nutrition / Metabolic widget OMITTED entirely
//
// Glass surface opacity is bumped from the HTML's `bg-white/[0.04]` to
// `bg-white/70` to follow the DESIGN.md "Level 1 (Widgets)" spec ("white
// surfaces at 70% opacity"). The 4% in the raw HTML is essentially
// invisible against the bright #f5faff base; 70% gives the intended
// frosted-glass effect on light mode.
//
// All data here is mock — Supabase wiring (daily_readiness + next workout
// query) lands in the follow-up commit.
// =============================================================================

import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Dumbbell,
  Minus,
  Play,
  Settings2,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METRIC_KEYS,
  useAthleteReadinessStore,
  type MetricKey,
  type MetricSnapshot,
} from "@/stores/useAthleteReadinessStore";
import { useDailyReadinessQuery } from "@/hooks/athlete/useAthleteReadinessHooks";

/** Today's date as ISO `YYYY-MM-DD` — used as the `daily_readiness.date` key. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// =============================================================================
// Metric polarity map — drives whether "today > yesterday" is rendered
// as improvement (green TrendingUp) or regression (amber TrendingDown).
// "Sonno is up" = better sleep = good. "Stress is up" = worse. The map
// lives at module scope (not inside the component) so its reference is
// stable across renders.
// =============================================================================
const POSITIVE_POLARITY: Record<MetricKey, "high-is-good" | "low-is-good"> = {
  Sonno: "high-is-good",
  Umore: "high-is-good",
  Digestione: "high-is-good",
  Stress: "low-is-good",
  Fatica: "low-is-good",
  Soreness: "low-is-good",
};

type TrendDirection = "up" | "down" | "flat";

function computeTrendDirection(
  metric: MetricKey,
  today: number | null,
  yesterday: number | null,
): TrendDirection {
  if (today === null || yesterday === null) return "flat";
  if (today === yesterday) return "flat";
  const ascending = today > yesterday;
  const polarity = POSITIVE_POLARITY[metric];
  const isImprovement =
    (ascending && polarity === "high-is-good") ||
    (!ascending && polarity === "low-is-good");
  return isImprovement ? "up" : "down";
}

// -----------------------------------------------------------------------------
// MOCK DATA — single source of truth for this page until we wire the hooks.
// -----------------------------------------------------------------------------
const MOCK = {
  athleteName: "Marco",
  nextWorkout: {
    title: "Forza Lower Body",
    durationMin: 45,
    intensity: "High" as const,
  },
} as const;

// =============================================================================
// ReadinessRing — inline SVG circular gauge.
//   - r=45, stroke=8 inside a 100×100 viewBox.
//   - Track is a translucent surface-variant ring; progress is brand cerulean.
//   - Rotated -90° so 0% starts at the 12 o'clock position.
// =============================================================================
function ReadinessRing({ value }: { value: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ≈ 282.74
  const safeValue = Math.max(0, Math.min(100, value));
  const dashOffset = circumference * (1 - safeValue / 100);

  return (
    <div
      role="img"
      aria-label={`Punteggio readiness ${safeValue} su 100`}
      className="relative w-28 h-28 flex items-center justify-center z-10"
    >
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#c5e7ff"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#226fa3"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold tabular-nums text-brand-container">
          {safeValue}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// MetricTrendRow — one dashboard metric: name + today value + trend icon.
// All three columns derived from the live readiness store.
// =============================================================================
function MetricTrendRow({
  metric,
  snapshot,
}: {
  metric: MetricKey;
  snapshot: MetricSnapshot;
}) {
  const direction = computeTrendDirection(
    metric,
    snapshot.today,
    snapshot.yesterday,
  );
  const Icon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const iconTint =
    direction === "up"
      ? "text-emerald-600"
      : direction === "down"
        ? "text-amber-600"
        : "text-on-surface-variant/60";
  const displayValue =
    snapshot.today === null ? "—" : Number.isInteger(snapshot.today)
      ? String(snapshot.today)
      : snapshot.today.toFixed(1);

  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant">
        {metric}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-display text-xs font-bold tabular-nums text-on-surface">
          {displayValue}
        </span>
        <Icon
          className={cn("h-3.5 w-3.5", iconTint)}
          strokeWidth={2.5}
          aria-label={
            direction === "up"
              ? "In miglioramento"
              : direction === "down"
                ? "In peggioramento"
                : "Stabile"
          }
        />
      </span>
    </div>
  );
}

// =============================================================================
// ReadinessCard — top glass widget, fully driven by useAthleteReadinessStore.
//
// Behaviour:
//   - The whole surface routes on tap: when the day's check-in is
//     completed → /athlete/readiness (multi-tab analysis), otherwise
//     → /athlete/daily-checkin (logging flow). The route decision uses
//     `isCompletedToday` from the store.
//   - The ring renders `dailyScore` when available, else 0 with a hint.
//   - The left column maps over `selectedDashboardMetrics` and renders
//     one MetricTrendRow per pick (default: Sonno / Stress / Fatica).
//   - A small Settings2 button (top-right) opens a native prompt so
//     the athlete can pick which 3 metrics to surface. stopPropagation
//     prevents it from triggering the card's navigation. The card uses
//     `role="button"` (not an actual <button>) precisely so this inner
//     button is HTML-valid.
// =============================================================================
function ReadinessCard({
  onOpen,
  onEditMetrics,
}: {
  onOpen: () => void;
  onEditMetrics: () => void;
}) {
  // Source of truth: the DB row for today. `isCompletedToday` is just
  // "did we get a row back" and `dailyScore` is its `score` column.
  const todayQuery = useDailyReadinessQuery(todayIso());
  const dailyScore = todayQuery.data?.score ?? null;
  const isCompletedToday = Boolean(todayQuery.data);

  const metrics = useAthleteReadinessStore((s) => s.metrics);
  const selectedDashboardMetrics = useAthleteReadinessStore(
    (s) => s.selectedDashboardMetrics,
  );

  const ringValue = isCompletedToday && dailyScore !== null ? dailyScore : 0;
  const ariaLabel = isCompletedToday
    ? "Apri l'analisi della Prontezza"
    : "Registra la tua Prontezza di oggi";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={ariaLabel}
      className={cn(
        "relative overflow-hidden w-full text-left",
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "flex justify-between items-center",
        "transition-transform active:scale-[0.99]",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-container/40",
      )}
    >
      {/* Ambient brand glow — decorative, behind everything else. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-brand-container/15 rounded-full blur-[40px]"
      />

      {/* Settings2 button — picks the 3 dashboard metrics. stopPropagation
          keeps the card's onClick from firing when this is tapped. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditMetrics();
        }}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label="Modifica metriche visibili"
        className={cn(
          "absolute top-3 right-3 z-20",
          "h-8 w-8 rounded-full",
          "flex items-center justify-center",
          "bg-white/70 backdrop-blur-md border border-[#c0c7d0]/30",
          "text-on-surface-variant",
          "hover:text-on-surface hover:bg-white transition-colors",
          "active:scale-95",
        )}
      >
        <Settings2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>

      {/* Left half: dynamic metric rows */}
      <div className="flex flex-col gap-3 z-10 w-1/2">
        <h2 className="font-display text-xl font-semibold text-brand-container leading-tight">
          Prontezza
        </h2>

        {selectedDashboardMetrics.map((key) => (
          <MetricTrendRow key={key} metric={key} snapshot={metrics[key]} />
        ))}
      </div>

      {/* Right half: circular gauge — value bound to the store */}
      <ReadinessRing value={ringValue} />
    </div>
  );
}

// =============================================================================
// NextWorkoutCard — middle glass widget with primary CTA. The "Inizia
// Sessione" button delegates to the page-level `onStart` handler so the
// store / navigation wiring lives in one place at the composition root.
// =============================================================================
function NextWorkoutCard({ onStart }: { onStart: () => void }) {
  return (
    <section
      aria-label="Prossimo allenamento"
      className={cn(
        "relative overflow-hidden",
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "flex flex-col gap-6",
      )}
    >
      {/* Soft brand gradient — decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-container/8 to-transparent opacity-70"
      />

      <div className="z-10">
        <span className="block font-sans text-[11px] font-semibold tracking-widest uppercase text-brand-container/80">
          Prossimo Allenamento
        </span>

        <p className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
          <Activity className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          {MOCK.nextWorkout.durationMin} min
          <span aria-hidden="true" className="opacity-60">
            ·
          </span>
          <Dumbbell className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          {MOCK.nextWorkout.intensity} intensity
        </p>

        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-brand-container">
          {MOCK.nextWorkout.title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={cn(
          "z-10 w-full",
          "flex items-center justify-center gap-2",
          "py-4 px-6 rounded-full",
          "bg-brand-container text-white",
          "font-sans text-base font-semibold",
          "shadow-[0_4px_14px_rgba(34,111,163,0.3)]",
          "active:scale-[0.98] transition-transform duration-200",
        )}
      >
        Inizia Sessione
        <Play
          className="h-5 w-5 fill-white"
          strokeWidth={0}
          aria-hidden="true"
        />
      </button>
    </section>
  );
}

// =============================================================================
// Header — sticks to the top of the layout's scroll container.
//
// Negative margins (-mx-5 / -mt-6) cancel the parent <main>'s padding so the
// header spans edge-to-edge and pins at top:0 cleanly. z-30 keeps it under
// the global bottom nav (z-50) but above all card content.
// =============================================================================
function Header() {
  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        "-mx-5 -mt-6 px-5 py-4",
        "backdrop-blur-3xl bg-white/85",
        "border-b border-[#c0c7d0]/40",
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-black tracking-tighter text-on-surface">
          NC Performance
        </h1>

        <Link
          to="/athlete/profile"
          aria-label="Apri profilo"
          className={cn(
            "h-10 w-10 rounded-full",
            "flex items-center justify-center",
            "bg-surface-container border border-[#c0c7d0]/50",
            "text-brand-container",
            "transition-transform active:scale-95",
          )}
        >
          <User className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

// =============================================================================
// AthleteDashboard — composition only. All visual work lives in the
// inline sub-components above.
// =============================================================================
export default function AthleteDashboard() {
  const navigate = useNavigate();
  // Atomic selectors — read state primitives only, never an object that
  // would force re-renders on every store mutation.
  // DB-backed "did the athlete check in today" — used to pick whether
  // the Prontezza card opens the analysis page or the logging flow.
  const todayReadinessQuery = useDailyReadinessQuery(todayIso());
  const isReadinessCompletedToday = Boolean(todayReadinessQuery.data);
  const currentSelectedMetrics = useAthleteReadinessStore(
    (s) => s.selectedDashboardMetrics,
  );
  const setSelectedMetrics = useAthleteReadinessStore(
    (s) => s.setSelectedMetrics,
  );

  /**
   * Readiness card tap — log first, analyse second. The branch reads
   * `isCompletedToday` straight from the store so a fresh check-in
   * submitted from /athlete/daily-checkin flips this to true and the
   * card transparently starts opening the analysis surface.
   */
  const handleReadinessCardClick = () => {
    if (isReadinessCompletedToday) {
      navigate("/athlete/readiness");
    } else {
      navigate("/athlete/daily-checkin");
    }
  };

  /**
   * Settings2 affordance on the Readiness card — opens a native prompt
   * (per brief: "keep it simple for now"). The user enters three
   * metric names separated by commas; the store's setSelectedMetrics
   * sanitises the input (dedups, clamps to 3, drops unknown keys).
   */
  const handleEditMetrics = () => {
    const current = currentSelectedMetrics.join(", ");
    const input = window.prompt(
      `Inserisci 3 metriche separate da virgola.\nDisponibili: ${METRIC_KEYS.join(
        ", ",
      )}`,
      current,
    );
    if (input === null) return; // cancel
    const parsed = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setSelectedMetrics(parsed as MetricKey[]);
  };

  /** Starts a session in the shared store and hands off to the
   *  full-screen active workout overlay. Identical contract to the
   *  AthleteTraining sticky CTA so both entry points stay symmetrical. */
  const handleStartWorkout = () => {
    // Session row is INSERTed in ActiveWorkout's mount effect so the
    // mutation only fires once we're truly on that page.
    navigate("/athlete/active-workout");
  };

  return (
    <div className="flex flex-col gap-4">
      <Header />

      {/* Greeting */}
      <section className="pt-2">
        <p className="font-display text-3xl font-bold tracking-tight text-on-surface">
          Ciao, {MOCK.athleteName}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Ecco il tuo riepilogo di oggi.
        </p>
      </section>

      <ReadinessCard
        onOpen={handleReadinessCardClick}
        onEditMetrics={handleEditMetrics}
      />
      <NextWorkoutCard onStart={handleStartWorkout} />
    </div>
  );
}
