import { useNavigate } from "react-router-dom";
import {
  X,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ArrowRightLeft,
  ArrowRight,
  TrendingDown,
  PlusCircle,
  CheckCircle,
} from "lucide-react";

const AthleteCopilotIntervention = () => {
  const navigate = useNavigate();

  const handleClose = () => navigate(-1);
  const handleAcceptSafePlan = () => {
    // TODO: Connect to backend - apply Copilot's adapted workout plan
    navigate(-1);
  };
  const handleKeepOriginal = () => {
    // TODO: Connect to backend - log override decision and continue with original plan
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center gap-4 px-6 h-16 bg-white/70 backdrop-blur-md shadow-sm border-b border-surface-variant/50 transition-all duration-300">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Chiudi"
          className="text-on-surface-variant hover:text-primary p-2 -ml-2 rounded-full"
        >
          <X className="size-5" />
        </button>
        <h1 className="font-display text-xl font-bold tracking-tight text-primary">
          Intervento Copilot
        </h1>
      </header>

      <main className="flex-grow pt-24 pb-48 px-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Insight Card - Why */}
        <section className="bg-white/80 backdrop-blur-xl border border-surface-variant/50 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="size-5" />
            </div>
            <h2 className="font-display text-2xl text-on-surface font-bold">
              Rischio Rilevato
            </h2>
          </div>
          <p className="text-on-surface-variant leading-relaxed text-base">
            Hai segnalato{" "}
            <span className="font-bold text-on-surface">
              DOMS severi ai Quadricipiti (9/10)
            </span>{" "}
            e scarso recupero del sonno.
          </p>
          <div className="mt-2 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5 size-5 shrink-0" />
            <p className="font-semibold text-sm text-red-900 leading-snug">
              Procedere con la sessione pesante di Lower Body Power di oggi
              aumenta il rischio di infortuni.
            </p>
          </div>
        </section>

        {/* Adaptation Card - What */}
        <section className="bg-surface-container rounded-2xl p-6 flex flex-col gap-5 border border-surface-variant/50 shadow-sm relative overflow-hidden">
          <div className="bg-primary/10 w-32 h-32 blur-3xl absolute -top-10 -right-10 rounded-full pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center shadow-inner">
              <Sparkles className="size-5" />
            </div>
            <h2 className="font-display text-2xl text-primary font-bold">
              Adattamenti Proposti
            </h2>
          </div>

          <ul className="flex flex-col gap-4 relative z-10">
            <li className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-surface-variant/30">
              <ArrowRightLeft className="text-secondary mt-0.5 size-5 shrink-0" />
              <div className="flex flex-col">
                <span className="line-through text-on-surface-variant/70 mr-2">
                  Barbell Back Squats
                </span>
                <div className="font-bold text-primary flex items-center gap-1 mt-1">
                  <ArrowRight size={16} /> Leg Extensions
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-surface-variant/30">
              <TrendingDown className="text-secondary mt-0.5 size-5 shrink-0" />
              <p className="text-on-surface font-medium">
                Volume totale ridotto del 20%
              </p>
            </li>
            <li className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-surface-variant/30">
              <PlusCircle className="text-secondary mt-0.5 size-5 shrink-0" />
              <p className="text-on-surface font-medium">
                Aggiunti 10 min di mobilità per le anche
              </p>
            </li>
          </ul>
        </section>
      </main>

      {/* Sticky Bottom Action */}
      <footer className="fixed bottom-0 left-0 w-full px-6 py-6 bg-white/90 backdrop-blur-xl border-t border-surface-variant/50 flex flex-col gap-4 z-50 pb-[env(safe-area-inset-bottom,24px)]">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAcceptSafePlan}
            className="w-full py-4 bg-primary text-white rounded-full font-bold text-xs uppercase tracking-[0.1em] shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <CheckCircle className="size-4" />
            Accetta Piano Sicuro
          </button>
          <button
            type="button"
            onClick={handleKeepOriginal}
            className="w-full py-3 text-secondary font-bold text-xs hover:bg-surface-container rounded-full transition-colors active:scale-[0.98] uppercase tracking-[0.1em] text-center"
          >
            Mantieni Piano Originale (Sconsigliato)
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AthleteCopilotIntervention;
