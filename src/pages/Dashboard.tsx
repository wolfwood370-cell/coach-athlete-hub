import { Header, BottomNav } from "@/components/layout";
import {
  ReadinessWidget,
  TodaysFocusWidget,
  NutritionSummaryWidget,
} from "@/components/dashboard";
import { mockReadiness, mockTodayWorkout, mockNutritionToday } from "@/data";

/**
 * Dashboard — home dell'atleta.
 *
 * Tre widget impilati ("Widget Cluster" verticale, vedi DESIGN.md):
 *
 *   1. Readiness — gauge circolare con score giornaliero + micro-metriche.
 *   2. Today's Focus — workout del giorno + CTA "Start Session".
 *   3. Nutrition Summary — macro rings + totali kcal.
 *
 * Layout: max-w-lg centrato, padding margin-mobile, gap gutter (12px).
 */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="LUMINA" showAvatar showNotificationsBell />

      <main
        className={[
          "flex-1 w-full max-w-lg mx-auto",
          "pt-[88px] px-margin-mobile pb-32",
          "space-y-gutter",
        ].join(" ")}
      >
        <ReadinessWidget readiness={mockReadiness} />
        <TodaysFocusWidget workout={mockTodayWorkout} />
        <NutritionSummaryWidget nutrition={mockNutritionToday} />
      </main>

      <BottomNav active="dashboard" />
    </div>
  );
}
