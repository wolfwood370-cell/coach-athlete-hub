// =============================================================================
// src/pages/athlete/AthleteDashboard.tsx
// =============================================================================
// "Oggi" — the athlete's daily landing page.
//
// Scope of this commit is the visual scaffold only: header brand mark +
// profile avatar, Italian greeting, and two glass placeholder cards for
// the Readiness gauge and the upcoming workout. Mock data is hard-coded
// so the page renders deterministically without a Supabase client.
//
// Real data plug-in (daily_readiness, workouts) will arrive in a follow-up
// commit once the routes are confirmed green.
// =============================================================================

import { Link } from "react-router-dom";
import { CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Mock data — replace with hooks (useDailyReadiness, useNextWorkout) later.
// -----------------------------------------------------------------------------
const MOCK = {
  athleteName: "Marco",
  readinessScore: 82,
  nextWorkout: {
    title: "W1: Lower Body Power",
    durationMin: 45,
    intensity: "High",
  },
};

export default function AthleteDashboard() {
  return (
    <div className="space-y-4">
      {/* -----------------------------------------------------------------
         Header — brand mark on the left, profile avatar on the right.
         Lives inside the page (not the layout) because the brief asks
         for it specifically on the dashboard.
         ----------------------------------------------------------------- */}
      <header className="flex items-center justify-between pt-2 pb-1">
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
          <CircleUserRound className="h-6 w-6" strokeWidth={1.75} />
        </Link>
      </header>

      {/* -----------------------------------------------------------------
         Greeting — Manrope display weight, kept tight against the
         widgets below so the dashboard feels above-the-fold dense.
         ----------------------------------------------------------------- */}
      <section className="pb-1">
        <p className="font-display text-2xl font-bold tracking-tight text-on-surface">
          Ciao, {MOCK.athleteName}
        </p>
        <p className="text-sm text-on-surface-variant">
          Ecco il tuo riepilogo di oggi.
        </p>
      </section>

      {/* -----------------------------------------------------------------
         Readiness widget — glass card with a placeholder gauge circle.
         The gauge will become an SVG progress ring once data lands.
         ----------------------------------------------------------------- */}
      <section
        aria-label="Readiness"
        className={cn(
          "relative overflow-hidden",
          "rounded-[28px] p-6",
          "bg-white/70 backdrop-blur-[20px]",
          "border border-[#c0c7d0]/30",
          "flex items-center justify-between",
        )}
      >
        {/* Ambient glow accent (decorative only) */}
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-32 h-32 bg-brand-container/10 rounded-full blur-[40px] pointer-events-none"
        />

        <div className="flex flex-col gap-1 z-10">
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-brand-container">
            Readiness
          </span>
          <span className="text-sm text-on-surface-variant">Punteggio di oggi</span>
        </div>

        {/* Placeholder gauge — final widget will be an SVG ring */}
        <div
          aria-hidden="true"
          data-testid="readiness-gauge-placeholder"
          className={cn(
            "relative z-10",
            "h-24 w-24 rounded-full",
            "flex items-center justify-center",
            "border-[6px] border-brand-container/15",
            "ring-1 ring-brand-container/10",
          )}
        >
          <span className="font-display text-3xl font-semibold tabular-nums text-brand-container">
            {MOCK.readinessScore}
          </span>
        </div>
      </section>

      {/* -----------------------------------------------------------------
         Prossimo Allenamento — second placeholder card. Mirrors the
         "Today's Focus" treatment from the reference HTML, kept neutral
         until the workouts query is wired.
         ----------------------------------------------------------------- */}
      <section
        aria-label="Prossimo allenamento"
        data-testid="next-workout-placeholder"
        className={cn(
          "relative overflow-hidden",
          "rounded-[28px] p-6",
          "bg-white/70 backdrop-blur-[20px]",
          "border border-[#c0c7d0]/30",
          "flex flex-col gap-4",
        )}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-brand-container/5 to-transparent opacity-60 pointer-events-none"
        />

        <div className="z-10">
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-brand-container/70">
            Prossimo Allenamento
          </span>
          <p className="mt-1 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
            ⏱ {MOCK.nextWorkout.durationMin} min · ⚡ {MOCK.nextWorkout.intensity} intensity
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold leading-tight text-on-surface">
            {MOCK.nextWorkout.title}
          </h2>
        </div>
      </section>
    </div>
  );
}
