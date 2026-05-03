import { useState } from "react";
import { Header, BottomNav } from "@/components/layout";
import { SegmentedControl, FAB } from "@/components/ui";
import {
  MacroSummaryCard,
  NutritionStatCard,
  MealTimeline,
} from "@/components/nutrition";
import {
  mockNutritionToday,
  mockNutritionStats,
  mockMealTimeline,
} from "@/data";

type NutritionTab = "diario" | "strategia";

/**
 * Nutrition — diario alimentare giornaliero.
 *
 * Sezioni:
 *   - Tab `Diario` / `Strategia`.
 *   - Macro Summary Card: kcal assunte/rimanenti + barre PRO/FAT/CARB.
 *   - Stat cards: dispendio energetico stimato + trend peso.
 *   - "Diario Alimentare": timeline dei pasti con timestamp e kcal.
 *   - FAB in basso a destra: aggiungi pasto.
 */
export default function Nutrition() {
  const [tab, setTab] = useState<NutritionTab>("diario");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title="Nutrition"
        leadingIcon="calendar_today"
        trailingIcon="settings"
      />

      <main
        className={[
          "flex-1 w-full max-w-lg mx-auto",
          "pt-[88px] px-margin-mobile pb-32",
          "flex flex-col gap-6",
        ].join(" ")}
      >
        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as NutritionTab)}
          options={[
            { value: "diario", label: "Diario" },
            { value: "strategia", label: "Strategia" },
          ]}
        />

        <MacroSummaryCard nutrition={mockNutritionToday} />

        <div className="grid grid-cols-2 gap-gutter">
          <NutritionStatCard stat={mockNutritionStats.expenditure} />
          <NutritionStatCard stat={mockNutritionStats.weightTrend} />
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="font-headline-lg text-headline-lg text-primary">
            Diario Alimentare
          </h2>
          <MealTimeline meals={mockMealTimeline} />
        </section>
      </main>

      <FAB icon="add" ariaLabel="Aggiungi pasto" />
      <BottomNav active="nutrition" />
    </div>
  );
}
