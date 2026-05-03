import { useState } from "react";
import { Header, BottomNav } from "@/components/layout";
import { SegmentedControl } from "@/components/ui";
import {
  WeekStrip,
  MainWorkoutCard,
  TrainingStatCard,
  WorkoutPhaseRow,
  StartWorkoutButton,
} from "@/components/training";
import {
  mockTrainingWeek,
  mockTodayWorkout,
  mockTrainingStats,
  mockWorkoutPhases,
} from "@/data";

type TrainingTab = "diario" | "metriche";

/**
 * Training — hub giornaliero dell'allenamento.
 *
 * Sezioni:
 *   - Tab `Diario` / `Metriche` (segmented control).
 *   - Week strip (7 giorni navigabili).
 *   - Card "Main Workout" del giorno selezionato.
 *   - Stat cards: carico settimanale + prontezza.
 *   - Lista delle fasi dell'allenamento (Movement Prep / Main Session / ...).
 *   - CTA fissa "Inizia Allenamento" sopra la BottomNav.
 *
 * UI statica: il tab è gestito da useState locale ma non cambia la vista
 * (il content `Metriche` può essere implementato in seconda passata).
 */
export default function Training() {
  const [tab, setTab] = useState<TrainingTab>("diario");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Training" showAvatar />

      <main
        className={[
          "flex-1 w-full max-w-lg mx-auto",
          "pt-[88px] px-margin-mobile pb-40",
          "flex flex-col gap-6",
        ].join(" ")}
      >
        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as TrainingTab)}
          options={[
            { value: "diario", label: "Diario" },
            { value: "metriche", label: "Metriche" },
          ]}
        />

        <WeekStrip days={mockTrainingWeek} />

        <MainWorkoutCard workout={mockTodayWorkout} />

        <div className="grid grid-cols-2 gap-gutter">
          <TrainingStatCard stat={mockTrainingStats.weeklyLoad} />
          <TrainingStatCard stat={mockTrainingStats.readiness} />
        </div>

        <section className="flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Fasi dell'Allenamento
            </h2>
            <button
              type="button"
              aria-label="Riordina fasi"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                swap_vert
              </span>
            </button>
          </header>
          <div className="flex flex-col gap-3">
            {mockWorkoutPhases.map((phase) => (
              <WorkoutPhaseRow key={phase.id} phase={phase} />
            ))}
          </div>
        </section>
      </main>

      <StartWorkoutButton label="Inizia Allenamento" />
      <BottomNav active="training" />
    </div>
  );
}
