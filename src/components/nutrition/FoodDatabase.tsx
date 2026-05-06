import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CheckCircle,
  ScanBarcode,
  Clock,
  Camera,
  Mic,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { searchFood } from "@/services/foodApi";

type QuickFilter = "Recenti" | "Preferiti" | "I Miei Cibi" | "Ricette";

interface FoodItem {
  id: string;
  name: string;
  subtitle: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
}

const QUICK_FILTERS: { label: QuickFilter; icon?: typeof Clock }[] = [
  { label: "Recenti", icon: Clock },
  { label: "Preferiti" },
  { label: "I Miei Cibi" },
  { label: "Ricette" },
];

const FoodDatabase = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("Recenti");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  // Recent foods from nutrition_logs (deduped by meal_name)
  const { data: recentFoods = [], isLoading: isLoadingRecents } = useQuery({
    queryKey: ["food-recents", user?.id],
    queryFn: async (): Promise<FoodItem[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("id, meal_name, calories, protein, fats, carbs, logged_at")
        .eq("athlete_id", user.id)
        .not("meal_name", "is", null)
        .order("logged_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      const seen = new Set<string>();
      const items: FoodItem[] = [];
      for (const row of data ?? []) {
        const name = row.meal_name ?? "";
        if (!name || seen.has(name)) continue;
        seen.add(name);
        items.push({
          id: row.id,
          name,
          subtitle: `${row.calories ?? 0} kcal`,
          kcal: row.calories ?? 0,
          protein: Math.round(Number(row.protein ?? 0)),
          fat: Math.round(Number(row.fats ?? 0)),
          carb: Math.round(Number(row.carbs ?? 0)),
        });
        if (items.length >= 8) break;
      }
      return items;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Search Open Food Facts
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["food-search", debouncedQuery],
    queryFn: async (): Promise<FoodItem[]> => {
      const results = await searchFood(debouncedQuery);
      return results.slice(0, 15).map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: `${r.brand ? r.brand + " • " : ""}${Math.round(r.calories ?? 0)} kcal/100g`,
        kcal: Math.round(r.calories ?? 0),
        protein: Math.round(r.protein ?? 0),
        fat: Math.round(r.fats ?? 0),
        carb: Math.round(r.carbs ?? 0),
      }));
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60_000,
  });

  const isSearchMode = debouncedQuery.trim().length >= 2;
  const visibleFoods = isSearchMode ? searchResults : recentFoods;

  // Drop selections that no longer exist in the visible list when switching
  useEffect(() => {
    setSelectedIds((prev) => {
      const ids = new Set(visibleFoods.map((f) => f.id));
      const next = new Set<string>();
      prev.forEach((id) => ids.has(id) && next.add(id));
      return next;
    });
  }, [visibleFoods]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totals = useMemo(() => {
    const items = visibleFoods.filter((f) => selectedIds.has(f.id));
    return {
      count: items.length,
      kcal: items.reduce((s, f) => s + f.kcal, 0),
      items,
    };
  }, [selectedIds, visibleFoods]);

  const logMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if (totals.items.length === 0) return;
      const today = format(new Date(), "yyyy-MM-dd");
      const rows = totals.items.map((f) => ({
        athlete_id: user.id,
        date: today,
        meal_name: f.name,
        calories: f.kcal,
        protein: f.protein,
        fats: f.fat,
        carbs: f.carb,
      }));
      const { error } = await supabase.from("nutrition_logs").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pasti registrati!");
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["food-recents"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-logs"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Errore nel salvataggio");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-md border-b border-surface-variant/50 shadow-sm">
        <button
          type="button"
          aria-label="Cerca"
          className="text-secondary"
        >
          <Search className="size-5" />
        </button>
        <h1 className="font-display font-bold text-lg text-primary">
          Log Nutrition
        </h1>
        <div
          className="w-8 h-8 rounded-full bg-surface-variant"
          aria-label="Profilo utente"
        />
      </header>

      <main className="pt-[88px] pb-[100px] px-6 max-w-md mx-auto flex flex-col gap-6">
        {/* Search Header */}
        <section>
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold text-on-surface">
              Aggiungi Cibo
            </h2>
            <CheckCircle className="text-primary size-6" />
          </div>
          <div className="relative w-full mt-4">
            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-container size-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca alimenti, brand o ricette..."
              className="w-full bg-surface-container-low border-none rounded-full py-3.5 pl-12 pr-4 font-body text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </section>

        {/* Quick Access Toggles */}
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-6 px-6">
          {QUICK_FILTERS.map(({ label, icon: Icon }) => {
            const active = activeFilter === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveFilter(label)}
                className={
                  active
                    ? "whitespace-nowrap rounded-full px-5 py-2.5 bg-primary text-white font-semibold text-xs flex items-center gap-1.5"
                    : "whitespace-nowrap rounded-full px-5 py-2.5 bg-surface-container text-on-surface-variant font-semibold text-xs"
                }
              >
                {active && Icon && <Icon className="size-4" />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Copilot Logger */}
        <section className="bg-white border-[1.5px] border-dashed border-primary-fixed rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <span className="font-semibold text-[10px] text-tertiary uppercase tracking-widest">
            ✨ Copilot Food Logger
          </span>
          <h3 className="font-display text-xl font-bold text-on-surface leading-tight">
            Fotografa il tuo piatto o descrivi cosa hai mangiato.
          </h3>
          <div className="flex flex-row gap-3 mt-2 relative z-10">
            <button
              type="button"
              className="flex-1 bg-tertiary text-white rounded-full py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-xs"
            >
              <Camera className="size-4" />
              Fotografa
            </button>
            <button
              type="button"
              className="flex-1 bg-surface-container-low text-primary rounded-full py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-xs"
            >
              <Mic className="size-4" />
              Descrivi
            </button>
          </div>
        </section>

        {/* Recents / Search List */}
        <section>
          <h4 className="font-semibold text-[10px] text-outline-variant uppercase tracking-widest pl-1 mb-2">
            {isSearchMode ? "Risultati" : "Cibi Recenti"}
          </h4>

          {(isSearchMode ? isSearching : isLoadingRecents) && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}

          {!((isSearchMode ? isSearching : isLoadingRecents)) && visibleFoods.length === 0 && (
            <p className="text-sm text-outline py-6 text-center">
              {isSearchMode ? "Nessun risultato" : "Nessun cibo recente"}
            </p>
          )}

          <ul>
            {visibleFoods.map((food) => {
              const selected = selectedIds.has(food.id);
              return (
                <li
                  key={food.id}
                  className="flex items-center justify-between py-3 px-1 border-b border-surface-variant/50"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium text-on-surface truncate">
                      {food.name}
                    </span>
                    <span className="text-xs text-outline">
                      {food.subtitle}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Pro {food.protein}g
                      </span>
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Fat {food.fat}g
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Carb {food.carb}g
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelect(food.id)}
                    aria-label={
                      selected ? "Rimuovi dalla selezione" : "Aggiungi al log"
                    }
                    className={
                      selected
                        ? "w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-3 transition-colors"
                        : "w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center shrink-0 ml-3 transition-colors"
                    }
                  >
                    {selected ? (
                      <Check className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* Multi-Select Floating Tray */}
      {totals.count > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[calc(28rem-48px)] bg-inverse-surface text-white rounded-2xl p-4 flex justify-between items-center shadow-lg z-50 backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {totals.count} {totals.count === 1 ? "elemento" : "elementi"}
            </span>
            <span className="text-xs text-surface-variant">
              Totale: {totals.kcal} kcal
            </span>
          </div>
          <button
            type="button"
            disabled={logMutation.isPending}
            onClick={() => logMutation.mutate()}
            className="bg-primary-container text-white px-6 py-2.5 rounded-full font-semibold text-xs disabled:opacity-60"
          >
            {logMutation.isPending ? "..." : "Log Ora"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodDatabase;
