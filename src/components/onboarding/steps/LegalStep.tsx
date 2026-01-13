import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, FileText, Camera } from "lucide-react";
import { LegalConsent } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface LegalStepProps {
  data: LegalConsent;
  onUpdate: (data: LegalConsent) => void;
}

const agreements = [
  {
    key: 'medicalDisclaimer' as const,
    icon: Shield,
    title: 'Dichiarazione Medica',
    description: 'Confermo di partecipare volontariamente ad attività fisica e sono responsabile della mia idoneità medica.',
  },
  {
    key: 'professionalScope' as const,
    icon: FileText,
    title: 'Ambito Professionale',
    description: 'Comprendo che Nicolò Castello fornisce coaching prestazionale, non consulenza medica o dietistica clinica.',
  },
  {
    key: 'dataAnalysis' as const,
    icon: Camera,
    title: 'Dati & Analisi',
    description: 'Acconsento alla memorizzazione dei miei dati e all\'uso di video-analisi (Telestration) per feedback tecnici.',
  },
];

export function LegalStep({ data, onUpdate }: LegalStepProps) {
  const handleToggle = (key: keyof LegalConsent) => {
    onUpdate({ ...data, [key]: !data[key] });
  };

  const allAccepted = data.medicalDisclaimer && data.professionalScope && data.dataAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Prima di iniziare
        </h2>
        <p className="text-muted-foreground">
          Conferma i seguenti accordi per procedere
        </p>
      </div>

      <div className="space-y-4 max-w-xl mx-auto">
        {agreements.map((agreement, index) => {
          const Icon = agreement.icon;
          const isChecked = data[agreement.key];

          return (
            <motion.div
              key={agreement.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleToggle(agreement.key)}
                className={cn(
                  "cursor-pointer transition-all duration-200 border-2",
                  isChecked 
                    ? "border-success bg-success/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isChecked ? "bg-success/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isChecked ? "text-success" : "text-muted-foreground"
                      )} />
                    </div>
                    
                    <div className="flex-1">
                      <Label className="font-semibold text-base cursor-pointer">
                        {agreement.title}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agreement.description}
                      </p>
                    </div>
                    
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(agreement.key)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {allAccepted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
            <Shield className="h-4 w-4" />
            Tutti gli accordi accettati
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
