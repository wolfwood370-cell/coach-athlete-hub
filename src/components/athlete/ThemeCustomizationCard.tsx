import { motion, AnimatePresence } from "framer-motion";
import { Palette, Sparkles, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useMaterialYou,
  NEUROTYPE_COLORS,
  MANUAL_COLOR_OPTIONS,
  Neurotype,
} from "@/providers/MaterialYouProvider";

function ColorSwatch({
  color,
  label,
  isSelected,
  onClick,
}: {
  color: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group"
      aria-label={`Select ${label} theme`}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative h-10 w-10 rounded-full transition-all duration-200",
          "ring-2 ring-offset-2 ring-offset-background",
          isSelected ? "ring-primary" : "ring-transparent hover:ring-muted-foreground/30"
        )}
        style={{ backgroundColor: color }}
      >
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="h-5 w-5 text-white drop-shadow-md" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <span className="text-[10px] text-muted-foreground font-medium">
        {label}
      </span>
    </button>
  );
}

function ThemePreview({ seedColor }: { seedColor: string }) {
  // Simple preview showing theme colors
  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-xl p-3 border border-border/50"
      style={{
        background: `linear-gradient(135deg, ${seedColor}15 0%, ${seedColor}05 100%)`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mini card preview */}
        <div
          className="h-12 w-20 rounded-lg shadow-sm"
          style={{ backgroundColor: seedColor }}
        />
        {/* Text lines preview */}
        <div className="flex-1 space-y-2">
          <div
            className="h-2 w-3/4 rounded-full"
            style={{ backgroundColor: `${seedColor}40` }}
          />
          <div
            className="h-2 w-1/2 rounded-full"
            style={{ backgroundColor: `${seedColor}20` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Anteprima Tema
      </p>
    </motion.div>
  );
}

export function ThemeCustomizationCard() {
  const {
    isNeuroSyncEnabled,
    setNeuroSyncEnabled,
    manualColor,
    setManualColor,
    userNeurotype,
    neurotypeSeedColor,
    theme,
  } = useMaterialYou();

  const displayedNeurotype = userNeurotype || "1B";
  const neurotypeName = NEUROTYPE_COLORS[displayedNeurotype as Neurotype].label;

  // Current effective color
  const currentColor = isNeuroSyncEnabled
    ? neurotypeSeedColor
    : manualColor || "#6366f1";

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Personalizzazione App</h3>
            <p className="text-xs text-muted-foreground">
              Personalizza i colori dell'app
            </p>
          </div>
        </div>

        {/* Neuro-Sync Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <Label htmlFor="neuro-sync" className="font-medium cursor-pointer">
                Sincronizza con Neurotipo
              </Label>
              <p className="text-xs text-muted-foreground">
                {isNeuroSyncEnabled
                  ? `Tema ${neurotypeName} attivo`
                  : "Usa colori ottimizzati per il tuo profilo"}
              </p>
            </div>
          </div>
          <Switch
            id="neuro-sync"
            checked={isNeuroSyncEnabled}
            onCheckedChange={setNeuroSyncEnabled}
          />
        </div>

        {/* Manual Color Picker */}
        <AnimatePresence mode="wait">
          {!isNeuroSyncEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Seleziona un colore
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {MANUAL_COLOR_OPTIONS.map((opt) => (
                  <ColorSwatch
                    key={opt.hex}
                    color={opt.hex}
                    label={opt.label}
                    isSelected={manualColor === opt.hex}
                    onClick={() => setManualColor(opt.hex)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme Preview */}
        <ThemePreview seedColor={currentColor || theme.seedColor} />
      </CardContent>
    </Card>
  );
}