// =============================================================================
// src/pages/athlete/AthleteTraining.tsx
// =============================================================================
// "Allenamenti" tab — placeholder.
//
// The real implementation will list the athlete's prescribed workouts
// (upcoming + history) backed by the `workouts` + `workout_logs` tables.
// For now we render only the page chrome so routing, navigation state,
// and styling can be confirmed end-to-end before data is wired.
// =============================================================================

import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AthleteTraining() {
  return (
    <div className="space-y-4">
      <header className="pt-2 pb-1">
        <span className="font-display text-xs font-semibold tracking-widest uppercase text-brand-container">
          Allenamenti
        </span>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-on-surface">
          I Tuoi Allenamenti
        </h1>
      </header>

      <section
        aria-label="Lista allenamenti — placeholder"
        data-testid="training-list-placeholder"
        className={cn(
          "rounded-[28px] p-8",
          "bg-white/70 backdrop-blur-[20px]",
          "border border-[#c0c7d0]/30",
          "flex flex-col items-center justify-center text-center gap-3",
          "min-h-[200px]",
        )}
      >
        <div className="h-12 w-12 rounded-full bg-brand-container/10 flex items-center justify-center">
          <Dumbbell className="h-6 w-6 text-brand-container" strokeWidth={1.75} />
        </div>
        <p className="font-display text-base font-semibold text-on-surface">
          Nessun allenamento da mostrare
        </p>
        <p className="text-sm text-on-surface-variant max-w-[280px]">
          Quando il tuo coach pianifica una sessione, la troverai qui.
        </p>
      </section>
    </div>
  );
}
