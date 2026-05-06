import { useNavigate } from "react-router-dom";
import { X, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";

interface CopilotSuggestion {
  name: string;
  prepMinutes: number;
  imageUrl: string;
  protein: number;
  fats: number;
  carbs: number;
  calories: number;
}

const FALLBACK_SUGGESTION: CopilotSuggestion = {
  name: "Petto di Pollo al Limone con Asparagi",
  prepMinutes: 15,
  imageUrl:
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80",
  protein: 48,
  fats: 6,
  carbs: 12,
  calories: 320,
};

const AthleteCopilotMeal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { targets, isLoading: loadingTargets } = useNutritionTargets();

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: consumed, isLoading: loadingConsumed } = useQuery({
    queryKey: ["nutrition-consumed-today", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("calories, protein, carbs, fats")
        .eq("athlete_id", user.id)
        .eq("date", today);
      if (error) throw error;
      return (data ?? []).reduce(
        (acc, r) => ({
          calories: acc.calories + (r.calories ?? 0),
          protein: acc.protein + Number(r.protein ?? 0),
          carbs: acc.carbs + Number(r.carbs ?? 0),
          fats: acc.fats + Number(r.fats ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 },
      );
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const isLoading = loadingTargets || loadingConsumed;

  const remaining = {
    protein: Math.max(0, Math.round(targets.protein - (consumed?.protein ?? 0))),
    carbs: Math.max(0, Math.round(targets.carbs - (consumed?.carbs ?? 0))),
    fats: Math.max(0, Math.round(targets.fats - (consumed?.fats ?? 0))),
  };

  // TODO: Connect to ask-copilot for AI-generated suggestion based on `remaining`.
  const suggestion = FALLBACK_SUGGESTION;

  const logMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("nutrition_logs").insert({
        athlete_id: user.id,
        date: today,
        meal_name: suggestion.name,
        calories: suggestion.calories,
        protein: suggestion.protein,
        carbs: suggestion.carbs,
        fats: suggestion.fats,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pasto registrato!");
      queryClient.invalidateQueries({ queryKey: ["nutrition-consumed-today"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-logs"] });
      navigate("/athlete/nutrition");
    },
    onError: () => toast.error("Errore nel salvataggio"),
  });

  const handleClose = () => navigate(-1);
  const handleRegenerate = () => {
    // TODO: Connect to backend - regenerate AI meal suggestion via ask-copilot
    toast.info("Generazione di una nuova opzione...");
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
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              {/* Protein Pill */}
              <div className="flex-1 bg-primary-container text-on-primary-container rounded-3xl p-5 flex flex-col justify-center items-center relative overflow-hidden shadow-sm">
                <span className="font-semibold text-[10px] uppercase tracking-widest opacity-80 mb-1">
                  Proteine
                </span>
                <span className="font-display text-4xl font-extrabold text-blue-100">
                  {remaining.protein}g
                </span>
              </div>
              {/* Carbs/Fat Stack */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-1 bg-surface-container-high text-on-surface-variant rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Carb
                  </span>
                  <span className="font-bold text-xl">{remaining.carbs}g</span>
                </div>
                <div className="flex-1 bg-surface-container-high text-on-surface-variant rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Grassi
                  </span>
                  <span className="font-bold text-xl">{remaining.fats}g</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Copilot Suggestion Card */}
        <section className="bg-white/70 backdrop-blur-xl rounded-[32px] p-2 border border-surface-variant shadow-sm relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/3 bg-primary rounded-r-full opacity-60" />

          <div className="relative w-full h-[220px] rounded-[28px] overflow-hidden mb-4">
            <img
              src={suggestion.imageUrl}
              alt={suggestion.name}
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
              {suggestion.name}
            </h3>
            <p className="text-sm text-secondary">
              Prep: {suggestion.prepMinutes} min • Match perfetto dei macro
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[
                `Pro: ${suggestion.protein}g`,
                `Grassi: ${suggestion.fats}g`,
                `Carb: ${suggestion.carbs}g`,
              ].map((tag) => (
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
          onClick={() => logMutation.mutate()}
          disabled={logMutation.isPending}
          className="w-full max-w-md mx-auto bg-primary text-white rounded-full py-4 flex justify-center items-center gap-2 font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform disabled:opacity-60"
        >
          <CheckCircle className="size-4" />
          {logMutation.isPending ? "Salvataggio..." : "Registra questo pasto"}
        </button>
      </div>
    </div>
  );
};

export default AthleteCopilotMeal;
