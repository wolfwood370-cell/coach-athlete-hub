// =============================================================================
// src/pages/athlete/AthleteProfile.tsx
// =============================================================================
// Profile — placeholder.
//
// Reached from the avatar button in the AthleteDashboard header. It is
// deliberately NOT in the bottom navigation (the brief asks for exactly
// two bottom-nav items: "Oggi" and "Allenamenti").
//
// The eventual page will render the athlete's profile data (name, neurotype,
// onboarding summary, account / logout actions). For now we keep it minimal
// so the route is reachable and styled consistently.
// =============================================================================

import { CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AthleteProfile() {
  return (
    <div className="space-y-4">
      <header className="pt-2 pb-1">
        <span className="font-display text-xs font-semibold tracking-widest uppercase text-brand-container">
          Profilo
        </span>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-on-surface">
          Il tuo profilo
        </h1>
      </header>

      <section
        aria-label="Profilo atleta — placeholder"
        data-testid="profile-placeholder"
        className={cn(
          "rounded-[28px] p-8",
          "bg-white/70 backdrop-blur-[20px]",
          "border border-[#c0c7d0]/30",
          "flex flex-col items-center justify-center text-center gap-3",
          "min-h-[200px]",
        )}
      >
        <div className="h-12 w-12 rounded-full bg-brand-container/10 flex items-center justify-center">
          <CircleUserRound className="h-6 w-6 text-brand-container" strokeWidth={1.75} />
        </div>
        <p className="font-display text-base font-semibold text-on-surface">
          Profilo in costruzione
        </p>
        <p className="text-sm text-on-surface-variant max-w-[280px]">
          Qui troverai le tue informazioni personali e le preferenze del tuo
          piano.
        </p>
      </section>
    </div>
  );
}
