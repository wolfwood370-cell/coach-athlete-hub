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
  { id: "cramps", label: "Cramps", emoji: "🔥" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "bloating", label: "Bloating", emoji: "💨" },
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "high_energy", label: "High Energy", emoji: "⚡" },
  { id: "mood_swings", label: "Mood Swings", emoji: "🎭" },
  { id: "breast_tenderness", label: "Breast Tenderness", emoji: "💜" },
  { id: "back_pain", label: "Back Pain", emoji: "🔙" },
  { id: "acne", label: "Acne", emoji: "🫧" },
  { id: "cravings", label: "Cravings", emoji: "🍫" },
  { id: "insomnia", label: "Insomnia", emoji: "🌙" },
  { id: "no_symptoms", label: "None", emoji: "✨" },
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
      toast({ title: "Symptoms logged ✓" });
      setSelected([]);
      onOpenChange(false);
    } catch {
      toast({ title: "Failed to log symptoms", variant: "destructive" });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Log Today's Symptoms</DrawerTitle>
          <DrawerDescription>
            Track how you feel to refine cycle predictions.
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
            {isSaving ? "Saving..." : "Save Symptoms"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
