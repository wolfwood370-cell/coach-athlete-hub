import { Link } from "react-router-dom";
import { Bell, Play, Moon, Activity, Heart } from "lucide-react";

const PRIMARY = "#226FA3";
const INK = "#043555";

function ReadinessGauge({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.7
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative w-28 h-28 flex items-center justify-center z-10">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#C5E7FF" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={PRIMARY}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-[Manrope] text-3xl font-medium tabular-nums" style={{ color: PRIMARY }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function MacroRing({
  size,
  stroke,
  color,
  offset,
}: {
  size: string;
  stroke: number;
  color: string;
  offset: number;
}) {
  return (
    <svg className={`absolute ${size} -rotate-90`} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="transparent" stroke="#C5E7FF" strokeWidth={stroke} />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="transparent"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray="282.7"
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function MiniRing({ label, letter, offset }: { label: string; letter: string; offset: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#C5E7FF" strokeWidth="12" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={PRIMARY}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset={offset}
          />
        </svg>
        <span className="text-[12px] font-bold" style={{ color: INK }}>
          {letter}
        </span>
      </div>
      <span className="text-[10px] uppercase font-bold" style={{ color: PRIMARY }}>
        {label}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-[Inter]">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-40 bg-slate-800 border-b border-slate-700">
        <div className="flex justify-between items-center w-full max-w-lg mx-auto px-6 py-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-slate-700">
            <img
              alt="User Avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAihu26ItmoIRv5TDvoaYq2YBQLpyd-aact0rqnD-UfZaRVu35z4GfNmNxYswVt30zQ6x5bREybufVclWH-NinBk2jTzvXb2mR92eiDmM7GXeB_8H44xZGWuylcnS1XoAu8X6hKHkMQo0zzoX7hq3RX8afnyKHvRhHogM3UOcm5SGOCWF0h_c_25YhuZXxXnuEqtGFb6__XCIhACU9AP4vxbrW1ik5qfFfLOkK37vL0Qk_ZD0oaRsOPBHKgL4it2SGYC0A7Z5VErE9M"
            />
          </div>
          <h1 className="font-[Manrope] font-black tracking-tighter text-xl text-white">LUMINA</h1>
          <button className="relative text-slate-300 hover:text-white transition-colors active:scale-95 duration-200">
            <Bell className="h-6 w-6" />
            <span
              className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-slate-800"
              style={{ background: PRIMARY }}
            />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-lg mx-auto pt-[88px] px-5 pb-28 space-y-3">
        {/* Readiness Widget */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-center relative overflow-hidden shadow-sm">
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] pointer-events-none"
            style={{ background: `${PRIMARY}1A` }}
          />
          <div className="flex flex-col gap-4 z-10 w-1/2">
            <h2 className="font-[Manrope] text-2xl font-semibold mb-2" style={{ color: PRIMARY }}>
              Readiness
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Moon className="h-3 w-3" /> Sleep · 7h 45m
              </span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: PRIMARY, boxShadow: "0 0 8px rgba(34,111,163,0.6)" }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Heart className="h-3 w-3" /> HRV Baseline
              </span>
              <svg fill="none" height="12" viewBox="0 0 40 12" width="40">
                <path
                  d="M1 9.5C6 9.5 7.5 2 12.5 2C17.5 2 19 10 24 10C29 10 32 4 39 4"
                  stroke={PRIMARY}
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Soreness
              </span>
              <div
                className="w-2 h-2 rounded-full bg-white border"
                style={{ borderColor: `${PRIMARY}80` }}
              />
            </div>
          </div>
          <ReadinessGauge score={88} />
        </section>

        {/* Today's Training */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}0D, transparent)` }}
          />
          <div className="z-10 mb-6">
            <span
              className="text-[12px] font-semibold uppercase tracking-widest block mb-1"
              style={{ color: `${PRIMARY}99` }}
            >
              Today's Focus
            </span>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#50768E]">
                ⏱ 45 Min · ⚡ High Intensity
              </span>
            </div>
            <h2
              className="font-[Manrope] text-2xl font-semibold leading-tight"
              style={{ color: PRIMARY }}
            >
              W1: Lower Body Power
            </h2>
          </div>
          <Link
            to="#"
            className="z-10 w-full text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-200"
            style={{ background: PRIMARY }}
          >
            Start Session
            <Play className="h-5 w-5 fill-white" />
          </Link>
        </section>

        {/* Nutrition Widget */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 relative shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col w-1/2">
              <h2 className="font-[Manrope] text-[20px] font-semibold mb-4" style={{ color: INK }}>
                Nutrition
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Protein", value: 120 },
                  { label: "Fat", value: 45 },
                  { label: "Carb", value: 180 },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col">
                    <span className="text-[12px] font-semibold uppercase" style={{ color: PRIMARY }}>
                      {m.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-[Manrope] text-4xl font-bold leading-tight"
                        style={{ color: INK }}
                      >
                        {m.value}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: PRIMARY }}>
                        g
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[11px] uppercase font-bold tracking-wider" style={{ color: PRIMARY }}>
                2150 kcal in
              </div>
            </div>
            <div className="w-1/2 flex items-center justify-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <MacroRing size="w-full h-full" stroke={4} color="#ffb4ab" offset={60} />
                <MacroRing size="w-[80%] h-[80%]" stroke={5} color="#ffd899" offset={100} />
                <MacroRing size="w-[60%] h-[60%]" stroke={7} color="#a3defe" offset={40} />
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: INK }}>
                    - 350 kcal
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-around items-center pt-4 border-t border-slate-200">
            <MiniRing label="Fiber" letter="F" offset={80} />
            <MiniRing label="Water" letter="W" offset={150} />
            <MiniRing label="Sodium" letter="S" offset={40} />
          </div>
        </section>
      </main>
    </div>
  );
}
