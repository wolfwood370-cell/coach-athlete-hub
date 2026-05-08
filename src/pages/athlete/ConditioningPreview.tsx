import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Play, MoreVertical } from "lucide-react";

const ConditioningPreview = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleStart = () => {
    // TODO: Navigate to the conditioning execution timer
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* 1. Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant/50 shadow-sm">
        <button
          onClick={handleBack}
          className="text-on-surface hover:bg-surface-variant/50 p-2 rounded-full transition-colors"
          aria-label="Torna indietro"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="font-display font-semibold tracking-tight text-lg text-on-surface">
          Panoramica Allenamento
        </h1>

        <button
          className="text-on-surface hover:bg-surface-variant/50 p-2 rounded-full transition-colors"
          aria-label="Altre opzioni"
        >
          <MoreVertical size={20} />
        </button>
      </header>

      {/* 2. Main Layout */}
      <main className="pt-24 pb-32 px-6 max-w-md mx-auto w-full">
        {/* 3. Protocol Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-variant/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-semibold text-[10px] text-inverse-surface uppercase tracking-widest mb-2 block">
                Blocco di Condizionamento
              </span>
              <h2 className="font-display text-2xl font-bold text-inverse-surface">
                D. Engine Builder
              </h2>
            </div>
            <div className="bg-primary-container text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Clock size={16} />
              <span>EMOM 12 Minuti</span>
            </div>
          </div>

          <p className="text-on-surface-variant text-sm mb-8 max-w-xl">
            Lavoro metabolico alternato. Rispetta la finestra di lavoro del minuto.
          </p>

          {/* 4. Blueprint Container (Circuit Logic) */}
          <div className="bg-surface-container-low rounded-xl p-6">
            {/* Row 1 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <span className="bg-white text-inverse-surface font-bold text-xs px-4 py-2 rounded-full shadow-sm whitespace-nowrap shrink-0 border border-surface-variant/50">
                Minuto 1, 3, 5...
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-inverse-surface mb-1">
                  15x Kettlebell Swings
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Usa il carico pesante. Il tempo rimanente è recupero.
                </p>
              </div>
            </div>

            <hr className="border-t border-dashed border-surface-variant/80 my-6" />

            {/* Row 2 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <span className="bg-white text-inverse-surface font-bold text-xs px-4 py-2 rounded-full shadow-sm whitespace-nowrap shrink-0 border border-surface-variant/50">
                Minuto 2, 4, 6...
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-inverse-surface mb-1">
                  10x Burpees over the KB
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Ritmo costante. Il tempo rimanente è recupero.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Sticky Footer Action */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white/95 to-transparent pb-[env(safe-area-inset-bottom,24px)]">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleStart}
            className="w-full bg-primary-container text-white font-display font-bold text-lg py-4 rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>INIZIA SESSIONE</span>
            <Play size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditioningPreview;
