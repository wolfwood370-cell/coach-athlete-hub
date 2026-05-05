import { useState } from "react";
import { Calendar, Settings, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "diario" | "strategia";

interface MacroColProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  bulletClass: string;
  trackClass: string;
  fillClass: string;
}

interface LoggedMealProps {
  time: string;
  name: string;
  foods: string;
  kcal: number;
}

interface EmptyMealProps {
  time: string;
  name: string;
}

function MacroCol({
  label,
  current,
  target,
  unit,
  bulletClass,
  trackClass,
  fillClass,
}: MacroColProps) {
  const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={cn("w-2 h-2 rounded-full", bulletClass)} aria-hidden />
        <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold text-on-surface tabular-nums">
        {current}/{target}
        {unit}
      </span>
      <div className={cn("h-1 w-full rounded-full", trackClass)}>
        <div
          className={cn("h-full rounded-full transition-all", fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LoggedMeal({ time, name, foods, kcal }: LoggedMealProps) {
  return (
    <div className="relative">
      <span
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-primary-container flex items-center justify-center z-10"
        aria-hidden
      >
        <span className="w-2 h-2 bg-primary-container rounded-full" />
      </span>
      <div className="bg-white/80 backdrop-blur-md border border-surface-variant/50 rounded-xl p-4 flex justify-between items-center shadow-sm gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-primary-container font-semibold">
            {time}
          </span>
          <span className="font-semibold text-on-surface">{name}</span>
          <span className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">
            {foods}
          </span>
        </div>
        <span className="font-bold text-primary tabular-nums shrink-0">
          {kcal} kcal
        </span>
      </div>
    </div>
  );
}

function EmptyMeal({ time, name }: EmptyMealProps) {
  return (
    <div className="relative">
      <span
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-outline-variant flex items-center justify-center z-10"
        aria-hidden
      >
        <span className="w-2 h-2 bg-outline-variant/50 rounded-full" />
      </span>
      <div className="bg-transparent border border-dashed border-outline-variant/60 rounded-xl p-4 flex justify-between items-center gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-on-surface-variant font-semibold">
            {time}
          </span>
          <span className="font-semibold text-on-surface-variant">{name}</span>
          <span className="italic text-outline-variant text-xs mt-0.5">
            Nessun alimento inserito
          </span>
        </div>
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0 hover:bg-surface-container/80 transition-colors active:scale-95"
          aria-label={`Aggiungi alimento per ${name}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

export default function AthleteNutritionDiario() {
  const [tab, setTab] = useState<TabKey>("diario");

  const calories = { intake: 1850, remaining: 450, target: 2300 };
  const intakePct = Math.max(
    0,
    Math.min(100, Math.round((calories.intake / calories.target) * 100)),
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-6 h-16">
        <button
          type="button"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Apri calendario"
        >
          <Calendar className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="font-display font-extrabold tracking-tighter text-lg text-primary">
          Nutrition
        </h1>
        <button
          type="button"
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Impostazioni nutrizione"
        >
          <Settings className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      <main className="flex-1 px-6 pt-6 flex flex-col gap-6 max-w-md mx-auto pb-40 w-full">
        {/* Segmented Control */}
        <div className="bg-surface-container p-1 rounded-full flex w-full">
          <button
            type="button"
            onClick={() => setTab("diario")}
            className={cn(
              "flex-1 py-2 px-4 rounded-full font-semibold text-sm text-center transition-all",
              tab === "diario"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant",
            )}
          >
            Diario
          </button>
          <button
            type="button"
            onClick={() => setTab("strategia")}
            className={cn(
              "flex-1 py-2 px-4 rounded-full font-semibold text-sm text-center transition-all",
              tab === "strategia"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant",
            )}
          >
            Strategia
          </button>
        </div>

        {/* Macro Compass Card */}
        <section className="bg-white/70 backdrop-blur-xl border border-surface-variant/50 rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
          <div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-on-surface-variant tracking-widest font-bold">
                  Assunte
                </span>
                <span className="font-display text-3xl text-primary font-bold tabular-nums">
                  {calories.intake.toLocaleString("it-IT")} kcal
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase text-on-surface-variant tracking-widest font-bold">
                  Rimanenti
                </span>
                <span className="font-display text-3xl text-on-surface font-bold tabular-nums">
                  {calories.remaining.toLocaleString("it-IT")} kcal
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-primary/10 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full transition-all"
                style={{ width: `${intakePct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-variant/50">
            <MacroCol
              label="Pro"
              current={160}
              target={180}
              unit="g"
              bulletClass="bg-secondary"
              trackClass="bg-secondary/10"
              fillClass="bg-secondary"
            />
            <MacroCol
              label="Fat"
              current={55}
              target={65}
              unit="g"
              bulletClass="bg-primary"
              trackClass="bg-primary/10"
              fillClass="bg-primary"
            />
            <MacroCol
              label="Carb"
              current={180}
              target={250}
              unit="g"
              bulletClass="bg-blue-400"
              trackClass="bg-blue-400/10"
              fillClass="bg-blue-400"
            />
          </div>
        </section>

        {/* Glance Cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container rounded-xl p-4 flex justify-between items-center gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase text-on-surface-variant tracking-widest font-bold">
                Dispendio
              </span>
              <span className="font-display text-xl font-bold text-on-surface tabular-nums">
                2993 kcal
              </span>
            </div>
            <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
          </div>
          <div className="bg-surface-container rounded-xl p-4 flex justify-between items-center gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase text-on-surface-variant tracking-widest font-bold">
                Trend Peso
              </span>
              <span className="font-display text-xl font-bold text-on-surface tabular-nums">
                82.5 kg
              </span>
            </div>
            <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-rose-500 shrink-0">
              <TrendingDown className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
          </div>
        </section>

        {/* Daily Timeline */}
        <section>
          <h2 className="font-display text-2xl font-bold text-primary mb-4">
            Diario Alimentare
          </h2>
          <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-surface-variant">
            <LoggedMeal
              time="08:00"
              name="Colazione"
              foods="Avena, Uova"
              kcal={320}
            />
            <LoggedMeal
              time="13:30"
              name="Pranzo"
              foods="Pollo, Riso, Verdure"
              kcal={480}
            />
            <EmptyMeal time="19:00" name="Cena" />
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button
        type="button"
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-white rounded-full flex items-center justify-center shadow-lg z-40 active:scale-95 hover:bg-primary transition-colors"
        aria-label="Aggiungi pasto"
      >
        <Plus className="h-6 w-6" strokeWidth={2.25} />
      </button>
    </div>
  );
}
