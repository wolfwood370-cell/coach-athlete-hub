import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, MoreVertical, RotateCcw, Pause } from "lucide-react";

export default function AMRAPExecution() {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<string>("");
  const [reps, setReps] = useState<string>("");

  return (
    <div className="h-screen w-full flex flex-col justify-end overflow-hidden bg-surface relative">
      {/* Fake background header */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 h-16 z-30">
        <button
          onClick={() => navigate(-1)}
          className="text-primary p-2 -ml-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-primary font-bold tracking-widest text-xs uppercase">
          Sessione AMRAP
        </span>
        <button
          className="text-primary p-2 -mr-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Altre opzioni"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Dim overlay */}
      <div className="absolute inset-0 bg-on-background/20 backdrop-blur-sm z-40" />

      {/* Drawer */}
      <div className="relative z-50 w-full bg-white rounded-t-[32px] shadow-[0_-20px_60px_rgba(4,53,85,0.1)] flex flex-col max-h-[85vh]">
        {/* Drag Handle & Title */}
        <div className="w-full flex flex-col items-center pt-4 pb-2 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-surface-variant rounded-t-[32px]">
          <span className="w-12 h-1.5 bg-outline-variant/50 rounded-full mb-4" />
          <h2 className="font-display text-xl text-on-surface font-bold text-center">
            AMRAP • Metcon
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="p-6 flex flex-col gap-8 flex-1 overflow-y-auto pb-32">
          {/* Hero Timer */}
          <section className="flex flex-col items-center">
            <div className="text-[80px] leading-none font-display font-black text-primary-container tabular-nums tracking-tighter">
              11:45
            </div>
            <span className="text-xs text-secondary uppercase tracking-widest font-semibold mt-2">
              Tempo Rimanente
            </span>

            {/* Controls */}
            <div className="flex justify-center items-center gap-6 mt-4">
              <button
                className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary active:scale-95 transition-transform"
                aria-label="Ricomincia"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              <button
                className="w-24 h-24 rounded-full bg-inverse-surface flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                aria-label="Pausa"
              >
                <Pause className="w-10 h-10 fill-current" />
              </button>
              <button
                className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary font-bold text-xl active:scale-95 transition-transform"
                aria-label="Aggiungi un round"
              >
                +1
              </button>
            </div>
          </section>

          {/* Movements List */}
          <section className="bg-white border-2 border-surface-container rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs text-secondary uppercase tracking-wider mb-4 border-b border-surface-container pb-2">
              Movimenti
            </h3>
            <ul className="flex flex-col gap-4">
              {[
                "10x Trazioni",
                "20x Piegamenti",
                "30x Squat a corpo libero",
              ].map((movement) => (
                <li key={movement} className="flex items-center gap-4">
                  <span className="w-2 h-2 rounded-full bg-primary-container shrink-0" />
                  <span className="font-sans text-lg text-on-surface font-medium">
                    {movement}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Score Logging */}
          <section>
            <h3 className="text-xs text-secondary uppercase tracking-wider pl-2 mb-2">
              Registra il tuo punteggio
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="bg-surface-container rounded-2xl p-4 flex flex-col gap-2 cursor-text">
                <span className="text-sm text-secondary">Round</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-4xl font-display font-bold text-on-surface outline-none placeholder:text-outline-variant/50 w-full"
                />
              </label>
              <label className="bg-surface-container rounded-2xl p-4 flex flex-col gap-2 cursor-text">
                <span className="text-sm text-secondary">Ripetizioni Extra</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-4xl font-display font-bold text-on-surface outline-none placeholder:text-outline-variant/50 w-full"
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-md border-t border-surface-variant z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-full max-w-md mx-auto bg-primary-container text-white font-display text-xl font-bold py-5 rounded-full shadow-md flex items-center justify-center active:scale-[0.98] transition-transform"
        >
          Termina e Salva
        </button>
      </div>
    </div>
  );
}
