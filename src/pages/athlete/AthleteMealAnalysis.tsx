import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  Check,
} from "lucide-react";

interface DetectedItem {
  id: string;
  label: string;
}

const DETECTED_ITEMS: DetectedItem[] = [
  { id: "1", label: "Petto di Pollo Grigliato (200g)" },
  { id: "2", label: "Insalata Mista" },
  { id: "3", label: "Olio d'Oliva (1 cucchiaio)" },
];

const AthleteMealAnalysis = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);
  const handleConfirm = () => {
    // TODO: Connect to backend - persist meal log entry
  };
  const handleEdit = () => {
    // TODO: Connect to backend - open ingredient editor
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-surface-variant/50">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Indietro"
          className="text-on-surface"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-display font-bold text-lg text-on-surface">
          Analisi del Pasto
        </h1>
        <button
          type="button"
          aria-label="Altre opzioni"
          className="text-on-surface"
        >
          <MoreVertical className="size-5" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-40">
        {/* Hero Image */}
        <section className="relative w-full aspect-square bg-surface-container rounded-2xl overflow-hidden shadow-sm flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"
            alt="Pasto analizzato"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-surface-variant">
            <CheckCircle2 className="text-emerald-500 size-4" />
            <span className="font-semibold text-[10px] text-on-surface uppercase tracking-wider">
              Verificato dall'AI
            </span>
          </div>
        </section>

        {/* Breakdown Card */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-surface-variant/50 flex flex-col gap-6">
          <h2 className="font-display text-xl font-bold text-on-surface">
            Valori Nutrizionali Stimati
          </h2>

          <div className="flex items-end justify-between border-b border-surface-variant/50 pb-6">
            <div>
              <span className="font-display text-4xl font-extrabold text-on-surface">
                550
              </span>
              <span className="text-base font-normal text-on-surface-variant ml-1">
                kcal
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-on-surface-variant font-semibold">
                  Pro
                </span>
                <span className="font-bold text-lg text-on-surface">45g</span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-on-surface-variant font-semibold">
                  Fat
                </span>
                <span className="font-bold text-lg text-on-surface">20g</span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-on-surface-variant font-semibold">
                  Carb
                </span>
                <span className="font-bold text-lg text-on-surface">40g</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">
              Elementi Rilevati
            </h3>
            <ul className="flex flex-col gap-3">
              {DETECTED_ITEMS.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                  <span className="font-medium text-sm text-on-surface">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full px-6 pb-[env(safe-area-inset-bottom,32px)] pt-4 bg-gradient-to-t from-white via-white/95 to-transparent z-40 flex justify-center">
        <div className="max-w-lg w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full bg-primary-container text-white font-bold text-xs uppercase tracking-widest py-4 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg active:scale-95"
          >
            <Check className="size-4" />
            Conferma e Registra
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="w-full text-primary-container font-bold text-xs uppercase tracking-widest py-3 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors active:scale-95"
          >
            Modifica Ingredienti o Quantità
          </button>
        </div>
      </div>
    </div>
  );
};

export default AthleteMealAnalysis;
