import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Copy, Zap, ScanBarcode, ChevronRight, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

interface SmartCopyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged: () => void;
}

type Mode = "menu" | "quick-slider";

export function SmartCopyDrawer({ open, onOpenChange, onLogged }: SmartCopyDrawerProps) {
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const [mode, setMode] = useState<Mode>("menu");
  const [sliderValue, setSliderValue] = useState([500]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // Fetch yesterday's logs grouped by meal
  const yesterdayQuery = useQuery({
    queryKey: ["yesterday-meals", user?.id, yesterday],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("date", yesterday)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id && open,
  });

  const yesterdayLogs = yesterdayQuery.data ?? [];
  const yesterdayTotal = yesterdayLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);

  const handleCopyYesterday = async () => {
    if (!user?.id || yesterdayLogs.length === 0) return;
    setIsSubmitting(true);

    const today = format(new Date(), "yyyy-MM-dd");
    const inserts = yesterdayLogs.map((log) => ({
      athlete_id: user.id,
      date: today,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fats: log.fats,
      water: log.water,
      meal_name: log.meal_name ? `${log.meal_name} (copia)` : null,
    }));

    const { error } = await supabase.from("nutrition_logs").insert(inserts);

    if (error) {
      toast.error("Errore nella copia");
      haptic.error();
    } else {
      toast.success(`${inserts.length} pasti copiati da ieri!`);
      haptic.success();
      onLogged();
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const handleQuickAdd = async () => {
    if (!user?.id) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("nutrition_logs").insert({
      athlete_id: user.id,
      date: format(new Date(), "yyyy-MM-dd"),
      calories: sliderValue[0],
      meal_name: "Quick Add",
    });

    if (error) {
      toast.error("Errore");
      haptic.error();
    } else {
      toast.success(`+${sliderValue[0]} kcal aggiunte!`);
      haptic.success();
      onLogged();
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setMode("menu");
    setSliderValue([500]);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        onOpenChange(v);
      }}
    >
      <DrawerContent className="max-h-[70vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle>{mode === "menu" ? "Aggiungi Veloce" : "Quick Calories"}</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-3">
            {mode === "menu" ? (
              <>
                {/* Copy Yesterday */}
                <button
                  onClick={handleCopyYesterday}
                  disabled={yesterdayLogs.length === 0 || isSubmitting}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all",
                    "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
                    "border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]",
                    "active:scale-[0.98] disabled:opacity-50"
                  )}
                >
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Copy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Copia Ieri</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {yesterdayLogs.length > 0
                        ? `${yesterdayLogs.length} pasti • ${yesterdayTotal.toLocaleString()} kcal`
                        : "Nessun pasto registrato ieri"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>

                {/* Quick Add Calories */}
                <button
                  onClick={() => setMode("quick-slider")}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all",
                    "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
                    "border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]",
                    "active:scale-[0.98]"
                  )}
                >
                  <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Aggiungi Calorie</p>
                    <p className="text-xs text-muted-foreground">Stima rapida senza dettagli</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>

                {/* Scan Barcode (Mock) */}
                <button
                  onClick={() => toast.info("Scan Barcode sarà disponibile nella prossima versione!")}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all",
                    "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
                    "border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]",
                    "active:scale-[0.98] opacity-60"
                  )}
                >
                  <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <ScanBarcode className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Scan Barcode</p>
                    <p className="text-xs text-muted-foreground">Prossimamente</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px]">
                    Soon
                  </Badge>
                </button>
              </>
            ) : (
              /* Quick Slider Mode */
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <span className="text-5xl font-bold tabular-nums text-foreground">
                    {sliderValue[0]}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">kcal</p>
                </div>

                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  min={50}
                  max={1500}
                  step={50}
                  className="py-4"
                />

                {/* Quick presets */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {[200, 300, 500, 800, 1000].map((v) => (
                    <Button
                      key={v}
                      variant={sliderValue[0] === v ? "default" : "outline"}
                      size="sm"
                      className="rounded-full text-xs tabular-nums"
                      onClick={() => setSliderValue([v])}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="pt-2 border-t border-border/50">
            {mode === "quick-slider" && (
              <Button
                onClick={handleQuickAdd}
                className="w-full h-12 font-semibold"
                disabled={isSubmitting}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Aggiungi {sliderValue[0]} kcal
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full text-sm">
                {mode === "quick-slider" ? "Indietro" : "Chiudi"}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
