import { useNavigate } from "react-router-dom";
import { X, Sparkles, CheckCircle } from "lucide-react";

const AthleteCopilotMeal = () => {
  const navigate = useNavigate();

  const handleClose = () => navigate(-1);
  const handleRegenerate = () => {
    // TODO: Connect to backend - regenerate AI meal suggestion
  };
  const handleLogMeal = () => {
    // TODO: Connect to backend - log this meal to nutrition diary
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Contextual Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-background z-50">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Chiudi"
          className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-full text-on-surface hover:bg-surface-variant transition-colors"
        >
          <X className="size-5" />
        </button>
        <h1 className="font-display text-xl font-bold text-on-surface">
          Check-in Serale
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="px-6 flex flex-col gap-8 pb-40 max-w-md mx-auto">
        {/* Remaining Macros */}
        <section>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-4">
            Macro Rimanenti
          </h2>
          <div className="flex gap-3 w-full">
            {/* Protein Pill */}
            <div className="flex-1 bg-primary-container text-on-primary-container rounded-3xl p-5 flex flex-col justify-center items-center relative overflow-hidden shadow-sm">
              <span className="font-semibold text-[10px] uppercase tracking-widest opacity-80 mb-1">
                Proteine
              </span>
              <span className="font-display text-4xl font-extrabold text-blue-100">
                50g
              </span>
            </div>
            {/* Carbs/Fat Stack */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex-1 bg-surface-container-high text-on-surface-variant rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  Carb
                </span>
                <span className="font-bold text-xl">15g</span>
              </div>
              <div className="flex-1 bg-surface-container-high text-on-surface-variant rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  Grassi
                </span>
                <span className="font-bold text-xl">5g</span>
              </div>
            </div>
          </div>
        </section>

        {/* Copilot Suggestion Card */}
        <section className="bg-white/70 backdrop-blur-xl rounded-[32px] p-2 border border-surface-variant shadow-sm relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/3 bg-primary rounded-r-full opacity-60" />

          <div className="relative w-full h-[220px] rounded-[28px] overflow-hidden mb-4">
            <img
              src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80"
              alt="Petto di pollo al limone con asparagi"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="text-primary size-4" />
              <span className="text-xs font-bold text-primary uppercase">
                Suggerimento Copilot
              </span>
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-col gap-3">
            <h3 className="font-display text-lg font-bold text-on-surface leading-tight">
              Petto di Pollo al Limone con Asparagi
            </h3>
            <p className="text-sm text-secondary">
              Prep: 15 min • Match perfetto dei macro
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["Pro: 48g", "Grassi: 6g", "Carb: 12g"].map((tag) => (
                <span
                  key={tag}
                  className="bg-surface text-secondary px-3 py-1 rounded-full font-bold text-xs border border-surface-variant/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-12 pb-[env(safe-area-inset-bottom,32px)] px-6 z-40 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleRegenerate}
          className="w-full max-w-md mx-auto py-4 text-secondary font-bold text-xs uppercase tracking-widest hover:bg-surface-container-low rounded-full transition-colors"
        >
          Genera un'altra opzione
        </button>
        <button
          type="button"
          onClick={handleLogMeal}
          className="w-full max-w-md mx-auto bg-primary text-white rounded-full py-4 flex justify-center items-center gap-2 font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
        >
          <CheckCircle className="size-4" />
          Registra questo pasto
        </button>
      </div>
    </div>
  );
};

export default AthleteCopilotMeal;
