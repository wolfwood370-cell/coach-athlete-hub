import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BiometricsData } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface BiometricsStepProps {
  data: BiometricsData;
  onUpdate: (data: BiometricsData) => void;
}

export function BiometricsStep({ data, onUpdate }: BiometricsStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">I tuoi dati biometrici</h2>
        <p className="text-muted-foreground">
          Servono per calcolare TDEE, baseline metabolico e parametri di carico.
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Gender */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sesso biologico</Label>
          <RadioGroup
            value={data.gender || ""}
            onValueChange={(value) => onUpdate({ ...data, gender: value as BiometricsData["gender"] })}
            className="flex gap-3"
          >
            {[
              { value: "male", label: "Maschio" },
              { value: "female", label: "Femmina" },
              { value: "other", label: "Altro" },
            ].map((option) => (
              <div key={option.value} className="flex-1">
                <RadioGroupItem value={option.value} id={`gender-${option.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`gender-${option.value}`}
                  className={cn(
                    "flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                    "hover:border-primary/50"
                  )}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* DOB */}
        <div className="space-y-2">
          <Label htmlFor="dob" className="text-sm font-medium">Data di nascita</Label>
          <Input
            id="dob"
            type="date"
            value={data.dateOfBirth || ""}
            onChange={(e) => onUpdate({ ...data, dateOfBirth: e.target.value })}
            className="bg-card"
          />
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm font-medium">Altezza (cm)</Label>
            <Input
              id="height"
              type="number"
              min={100}
              max={250}
              placeholder="175"
              value={data.heightCm ?? ""}
              onChange={(e) =>
                onUpdate({ ...data, heightCm: e.target.value ? parseInt(e.target.value, 10) : null })
              }
              className="bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-medium">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min={30}
              max={300}
              placeholder="70"
              value={data.weightKg ?? ""}
              onChange={(e) =>
                onUpdate({ ...data, weightKg: e.target.value ? parseFloat(e.target.value) : null })
              }
              className="bg-card"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
