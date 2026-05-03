import { Link } from "react-router-dom";
import {
  Bell,
  Moon,
  Activity,
  Heart,
  Play,
  Timer,
  Zap,
} from "lucide-react";

/**
 * NC Performance — Athlete Home Dashboard (Dense)
 * Imported from external Stitch design. Pure presentation; mock data.
 *
 * NOTE: A global <BottomNavigation /> is rendered by the shell. We add
 * pb-32 to the scroll area so content is never obscured by it.
 */
export default function DashboardPage() {
  return (
    <div className="min-h-full w-full bg-slate-50 text-slate-900 flex flex-col">
      {/* Top App Bar — dark */}
      <header className="sticky top-0 z-40 w-full bg-slate-800 border-b border-slate-700/60 backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-slate-700">
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAihu26ItmoIRv5TDvoaYq2YBQLpyd-aact0rqnD-UfZaRVu35z4GfNmNxYswVt30zQ6x5bREybufVclWH-NinBk2jTzvXb2mR92eiDmM7GXeB_8H44xZGWuylcnS1XoAu8X6hKHkMQo0zzoX7hq3RX8afnyKHvRhHogM3UOcm5SGOCWF0h_c_25YhuZXxXnuEqtGFb6__XCIhACU9AP4vxbrW1ik5qfFfLOkK37vL0Qk_ZD0oaRsOPBHKgL4it2SGYC0A7Z5VErE9M"
              />
            </div>
          </div>
          <h1 className="font-black tracking-tighter text-xl text-white">LUMINA</h1>
          <button
            className="relative text-slate-300 hover:text-white transition-colors active:scale-95 duration-200"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-[#226FA3] ring-2 ring-slate-800" />
          </button>
        </div>
      </header>

      {/* Main scrollable content — pb-32 keeps content clear of global BottomNavigation */}
      <main className="flex-1 w-full max-w-lg mx-auto px-5 pt-4 pb-32 space-y-3">
        {/* Readiness Widget */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 flex justify-between items-center shadow-sm">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#226FA3]/10 rounded-full blur-[40px] pointer-events-none" />
          {/* Left: micro-metrics */}
          <div className="flex flex-col gap-4 z-10 w-1/2">
            <h2 className="text-2xl font-bold text-[#043555] mb-2 font-[Manrope]">
              Readiness
            </h2>
            <MetricRow icon={<Moon className="h-3.5 w-3.5 text-[#226FA3]" />} label="Sleep · 7h 45m" value="92" />
            <MetricRow icon={<Heart className="h-3.5 w-3.5 text-[#226FA3]" />} label="HRV Baseline" value="+8%" />
            <MetricRow icon={<Activity className="h-3.5 w-3.5 text-[#226FA3]" />} label="Soreness" value="Low" />
          </div>
          {/* Right: gauge */}
          <div className="relative w-28 h-28 flex items-center justify-center z-10">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="#226FA3"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - 0.88)}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-semibold tabular-nums text-[#043555] font-[Manrope]">
                88
              </span>
            </div>
          </div>
        </section>

        {/* Today's Training Widget */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-[#226FA3]/5 to-transparent opacity-50 pointer-events-none" />
          <div className="z-10 mb-6">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#226FA3]/70 block mb-1">
              Today's Focus
            </span>
            <div className="flex items-center gap-3 mb-2 text-[#50768E] text-[12px] font-semibold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" /> 45 Min
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" /> High Intensity
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight text-[#043555] font-[Manrope]">
              W1: Lower Body Power
            </h2>
          </div>
          <Link
            to="#"
            className="z-10 w-full bg-[#226FA3] hover:bg-[#1d5f8c] text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-200 min-h-12"
          >
            Start Session
            <Play className="h-5 w-5 fill-white" />
          </Link>
        </section>

        {/* Metabolic & Nutrition Widget */}
        <section className="relative rounded-2xl border border-slate-200 bg-white p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col w-1/2">
              <h2 className="text-[20px] font-bold text-[#043555] mb-4 font-[Manrope]">
                Nutrition
              </h2>
              <div className="space-y-4">
                <MacroStat label="Protein" value="120" />
                <MacroStat label="Fat" value="45" />
                <MacroStat label="Carb" value="180" />
              </div>
            </div>
            <div className="w-1/2 flex items-center justify-center">
              <ConcentricMacroRings />
            </div>
          </div>
          <div className="flex justify-around items-center pt-4 border-t border-slate-200">
            <MiniRing letter="F" label="Fiber" progress={0.68} />
            <MiniRing letter="W" label="Water" progress={0.4} />
            <MiniRing letter="S" label="Sodium" progress={0.84} />
          </div>
          <div className="text-center -mt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#226FA3]">
              2150 KCAL IN · −350 KCAL DEFICIT
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-[12px] font-bold text-[#043555] tabular-nums">{value}</span>
    </div>
  );
}

function MacroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-[#226FA3]">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold leading-tight text-[#043555] font-[Manrope]">
          {value}
        </span>
        <span className="text-[12px] font-semibold text-[#226FA3]">g</span>
      </div>
    </div>
  );
}

function ConcentricMacroRings() {
  const C = 2 * Math.PI * 45;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Protein */}
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke="#ffb4ab"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - 0.78)}
        />
      </svg>
      {/* Fat */}
      <svg className="absolute w-[80%] h-[80%] -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#E2E8F0" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke="#ffd899"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - 0.65)}
        />
      </svg>
      {/* Carb */}
      <svg className="absolute w-[60%] h-[60%] -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#E2E8F0" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke="#a3defe"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - 0.86)}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-bold text-[#043555] whitespace-nowrap">
          −350 kcal
        </span>
      </div>
    </div>
  );
}

function MiniRing({
  letter,
  label,
  progress,
}: {
  letter: string;
  label: string;
  progress: number;
}) {
  const C = 2 * Math.PI * 40;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="12" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#226FA3"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
          />
        </svg>
        <span className="text-[12px] font-bold text-[#043555]">{letter}</span>
      </div>
      <span className="text-[10px] uppercase font-bold text-[#226FA3]">{label}</span>
    </div>
  );
}
