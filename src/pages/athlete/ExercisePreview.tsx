import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Zap, Repeat, ClipboardList, Play } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop";

export default function ExercisePreview() {
  const navigate = useNavigate();

  // TODO: Connect to backend — derive from selected exercise / today's workout
  const dayTitle = "Giorno Gambe B";
  const phaseLabel = "Fase Ipertrofia";
  const durationMin = 65;

  const exerciseTitle = "C1. Leg Curl Seduto";
  const exerciseSubtitle = "Isolamento • 1 Serie Totale (Protocollo esteso)";
  const protocolName = "Rest-Pause";

  const activationTitle = "Serie di Attivazione: 10-12 Reps @ RPE 9";
  const activationDesc =
    "Raggiungi il cedimento, poi recupera esattamente 15 secondi.";

  const microTitle = "Micro-Set: 3-5 Reps x 4 Round";
  const microDesc =
    "15 sec di recupero tra i round. Fermati quando non chiudi 3 reps.";

  const coachNote =
    "Note: Mantieni tensione costante nel punto di massima contrazione.";

  const targetVolume = 24;
  const targetIntensity = 9.5;

  const handleStart = () => {
    // TODO: Connect to backend — start active session
    navigate("/athlete/active-workout");
  };

  return (
    <div className="min-h-screen bg-surface-bright">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant/50 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-primary p-2 -ml-2 rounded-full hover:bg-surface-variant/50 transition-colors"
            aria-label="Indietro"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-semibold tracking-tight text-lg text-on-surface">
            Panoramica Allenamento
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-variant" />
      </header>

      {/* Main */}
      <main className="pt-24 pb-32 px-6 max-w-md mx-auto">
        {/* Screen Header */}
        <div className="mb-6">
          <h2 className="font-display text-4xl text-inverse-surface font-bold mb-2">
            {dayTitle}
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold text-xs uppercase tracking-wider">
              {phaseLabel}
            </span>
            <span className="text-on-surface-variant font-semibold text-xs uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {durationMin} Min
            </span>
          </div>
        </div>

        {/* Intensity Protocol Preview Card */}
        <article className="bg-white rounded-2xl shadow-sm border border-surface-variant/50 overflow-hidden mb-6">
          {/* Image Header */}
          <div className="h-48 w-full relative">
            <img
              src={HERO_IMAGE}
              alt="Anteprima esercizio"
              className="object-cover w-full h-full"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          {/* Card Content */}
          <div className="p-6 -mt-8 relative z-10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-primary-container text-[10px] uppercase tracking-widest font-bold">
                Tecnica di Intensità
              </span>
              <span className="bg-primary-container text-white text-xs px-4 py-1 rounded-full shadow-sm">
                {protocolName}
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-primary-container mb-1">
              {exerciseTitle}
            </h3>
            <p className="text-secondary text-sm">{exerciseSubtitle}</p>

            {/* Protocol Breakdown */}
            <div className="bg-surface-bright rounded-2xl p-5 border border-surface-variant/50 mt-6 space-y-8">
              {/* Row 1 */}
              <div className="relative flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-primary-container/20 flex items-center justify-center shadow-sm shrink-0 mt-1">
                  <Zap className="size-3 text-primary-container" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">
                    {activationTitle}
                  </p>
                  <p className="text-secondary text-xs mt-1">
                    {activationDesc}
                  </p>
                </div>
              </div>

              {/* Row 2 with L-bracket */}
              <div className="pl-8 relative flex items-start gap-3">
                <div className="absolute -left-[14px] -top-[40px] w-[14px] h-[54px] border-l border-b border-surface-variant/80 rounded-bl-lg" />
                <div className="w-6 h-6 rounded-full bg-white border border-primary-container/20 flex items-center justify-center shadow-sm shrink-0 mt-1">
                  <Repeat className="size-3 text-primary-container" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">
                    {microTitle}
                  </p>
                  <p className="text-secondary text-xs mt-1">{microDesc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coaching Insight Footnote */}
          <div className="bg-primary-container/5 border-t border-primary-container/10 p-5 flex items-center gap-3">
            <ClipboardList className="text-primary-container w-4 h-4 shrink-0" />
            <p className="text-[11px] font-medium text-primary-container uppercase tracking-wider">
              {coachNote}
            </p>
          </div>
        </article>

        {/* Context Widgets */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-surface-variant/50 shadow-sm">
            <span className="text-secondary text-xs uppercase tracking-widest font-semibold mb-2 block">
              Target Volume
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-on-surface">
                {targetVolume}
              </span>
              <span className="text-xs text-on-surface-variant">REPS</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-surface-variant/50 shadow-sm">
            <span className="text-secondary text-xs uppercase tracking-widest font-semibold mb-2 block">
              Intensità
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-on-surface">
                {targetIntensity}
              </span>
              <span className="text-xs text-on-surface-variant">RPE</span>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface-bright via-surface-bright to-transparent z-40 pb-[env(safe-area-inset-bottom,24px)]">
        <button
          onClick={handleStart}
          className="w-full bg-primary-container text-white font-display font-bold py-5 rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
        >
          Inizia Sessione
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
