import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Footprints, Moon, Scale, AlertCircle } from "lucide-react";
import { LifestyleData } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface LifestyleStepProps {
  data: LifestyleData;
  onUpdate: (data: LifestyleData) => void;
}

export function LifestyleStep({ data, onUpdate }: LifestyleStepProps) {
  const needsReverseDiet = data.recentDiet === true && data.weightTrend === 'down';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Stile di vita & Metabolismo
        </h2>
        <p className="text-muted-foreground">
          Questi dati alimentano il nostro algoritmo TDEE
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        {/* Daily Steps */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Footprints className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Passi medi giornalieri?</Label>
          </div>
          
          <RadioGroup
            value={data.dailySteps || ''}
            onValueChange={(value) => onUpdate({ ...data, dailySteps: value as LifestyleData['dailySteps'] })}
            className="grid grid-cols-2 gap-2"
          >
            {[
              { value: '<5k', label: 'Meno di 5.000' },
              { value: '5-8k', label: '5.000 - 8.000' },
              { value: '8-12k', label: '8.000 - 12.000' },
              { value: '>12k', label: 'Più di 12.000' },
            ].map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={`steps-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`steps-${option.value}`}
                  className={cn(
                    "flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all text-sm",
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

        {/* Sleep Hours */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Ore di sonno <span className="text-muted-foreground">reali</span> per notte?</Label>
          </div>
          
          <RadioGroup
            value={data.sleepHours || ''}
            onValueChange={(value) => onUpdate({ ...data, sleepHours: value as LifestyleData['sleepHours'] })}
            className="grid grid-cols-5 gap-2"
          >
            {[
              { value: '<5h', label: '<5h' },
              { value: '5-6h', label: '5-6h' },
              { value: '6-7h', label: '6-7h' },
              { value: '7-8h', label: '7-8h' },
              { value: '>8h', label: '>8h' },
            ].map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={`sleep-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`sleep-${option.value}`}
                  className={cn(
                    "flex items-center justify-center px-3 py-3 rounded-lg border-2 cursor-pointer transition-all text-sm",
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

        {/* Diet History */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Negli ultimi 3 mesi, hai seguito diete ipocaloriche?</Label>
          </div>
          
          <RadioGroup
            value={data.recentDiet === null ? '' : data.recentDiet ? 'yes' : 'no'}
            onValueChange={(value) => onUpdate({ 
              ...data, 
              recentDiet: value === 'yes',
              weightTrend: value === 'no' ? null : data.weightTrend 
            })}
            className="flex gap-3"
          >
            {[
              { value: 'yes', label: 'Sì' },
              { value: 'no', label: 'No' },
            ].map((option) => (
              <div key={option.value} className="flex-1">
                <RadioGroupItem
                  value={option.value}
                  id={`diet-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`diet-${option.value}`}
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

        {/* Weight Trend (conditional) */}
        {data.recentDiet === true && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <Label className="text-sm font-medium">Il tuo peso è...</Label>
            
            <RadioGroup
              value={data.weightTrend || ''}
              onValueChange={(value) => onUpdate({ ...data, weightTrend: value as LifestyleData['weightTrend'] })}
              className="flex gap-3"
            >
              {[
                { value: 'stable', label: 'Stabile' },
                { value: 'down', label: 'Sceso' },
                { value: 'up', label: 'Salito' },
              ].map((option) => (
                <div key={option.value} className="flex-1">
                  <RadioGroupItem
                    value={option.value}
                    id={`trend-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`trend-${option.value}`}
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
          </motion.div>
        )}

        {/* Reverse Diet Alert */}
        {needsReverseDiet && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 px-4 py-3 rounded-lg bg-warning/10 border border-warning/30"
          >
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Possibile adattamento metabolico rilevato</p>
              <p className="text-xs text-muted-foreground mt-1">
                Potrebbe essere necessario un periodo di "Reverse Diet" prima di iniziare un nuovo deficit calorico.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
