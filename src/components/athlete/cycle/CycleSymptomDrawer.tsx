import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "@/hooks/use-toast";

const SYMPTOM_OPTIONS = [
  { id: "cramps", label: "Crampi", emoji: "🔥" },
  { id: "headache", label: "Mal di Testa", emoji: "🤕" },
  { id: "bloating", label: "Gonfiore", emoji: "💨" },
  { id: "fatigue", label: "Stanchezza", emoji: "😴" },
  { id: "high_energy", label: "Alta Energia", emoji: "⚡" },
  { id: "mood_swings", label: "Sbalzi d'Umore", emoji: "🎭" },
  { id: "breast_tenderness", label: "Tensione Mammaria", emoji: "💜" },
  { id: "back_pain", label: "Mal di Schiena", emoji: "🔙" },
  { id: "acne", label: "Acne", emoji: "🫧" },
  { id: "cravings", label: "Voglie", emoji: "🍫" },
  { id: "insomnia", label: "Insonnia", emoji: "🌙" },
  { id: "no_symptoms", label: "Nessuno", emoji: "✨" },
];

interface CycleSymptomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (symptoms: string[]) => Promise<void>;
  isSaving: boolean;
}

export function CycleSymptomDrawer({
  open,
  onOpenChange,
  onSave,
  isSaving,
}: CycleSymptomDrawerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (id === "no_symptoms") {
      setSelected(["no_symptoms"]);
      return;
    }
    setSelected((prev) => {
      const without = prev.filter((s) => s !== "no_symptoms");
      return without.includes(id)
        ? without.filter((s) => s !== id)
        : [...without, id];
    });
  };

  const handleSave = async () => {
    try {
      await onSave(selected);
      toast({ title: "Sintomi registrati ✓" });
      setSelected([]);
      onOpenChange(false);
    } catch {
      toast({ title: "Errore nella registrazione dei sintomi", variant: "destructive" });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Registra i Sintomi di Oggi</DrawerTitle>
          <DrawerDescription>
            Tieni traccia di come ti senti per affinare le previsioni del ciclo.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((symptom) => {
              const isActive = selected.includes(symptom.id);
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggle(symptom.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all",
                    "border",
                    isActive
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <span>{symptom.emoji}</span>
                  {symptom.label}
                  {isActive && <Check className="h-3 w-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSave}
            disabled={isSaving || selected.length === 0}
          >
            {isSaving ? "Salvataggio..." : "Salva Sintomi"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Annulla</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
