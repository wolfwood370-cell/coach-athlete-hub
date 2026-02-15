import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { triggerConfetti } from "@/utils/ux";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { LegalStep } from "@/components/onboarding/steps/LegalStep";
import { BiometricsStep } from "@/components/onboarding/steps/BiometricsStep";
import { LifestyleStep } from "@/components/onboarding/steps/LifestyleStep";
import { TrainingStep } from "@/components/onboarding/steps/TrainingStep";
import { NeurotypStep } from "@/components/onboarding/steps/NeurotypStep";
import { NeurotypResult } from "@/components/onboarding/NeurotypResult";
import {
  OnboardingData,
  defaultOnboardingData,
  NeurotypType,
  neurotypQuestions,
  answerScores,
} from "@/types/onboarding";

const STEP_LABELS = ["Legale", "Biometria", "Lifestyle", "Training", "Neurotype"];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dominantType, setDominantType] = useState<NeurotypType | null>(null);
  const [scores, setScores] = useState<Record<NeurotypType, number>>({ '1A': 0, '1B': 0, '2A': 0, '2B': 0, '3': 0 });

  const calculateNeurotype = (): { dominant: NeurotypType; scores: Record<NeurotypType, number> } => {
    const typeScores: Record<NeurotypType, number> = { '1A': 0, '1B': 0, '2A': 0, '2B': 0, '3': 0 };

    data.neurotypAnswers.forEach((answer) => {
      const question = neurotypQuestions[answer.questionIndex];
      if (question) {
        const scoreValues = answerScores[answer.value];
        const score = question.weight === 'A' ? scoreValues.A : scoreValues.B;
        typeScores[question.type] += score;
      }
    });

    const dominant = (Object.entries(typeScores) as [NeurotypType, number][])
      .sort(([, a], [, b]) => b - a)[0][0];

    return { dominant, scores: typeScores };
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.legal.medicalDisclaimer && data.legal.professionalScope && data.legal.dataAnalysis;
      case 2:
        return data.biometrics.gender && data.biometrics.dateOfBirth && data.biometrics.heightCm && data.biometrics.weightKg;
      case 3:
        return data.lifestyle.dailySteps && data.lifestyle.sleepHours && data.lifestyle.recentDiet !== null;
      case 4:
        return data.training.heartCondition !== null && data.training.chestPain !== null;
      case 5:
        return data.neurotypAnswers.length === 30;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 5) {
      const result = calculateNeurotype();
      setDominantType(result.dominant);
      setScores(result.scores);
      setShowResult(true);
    } else {
      setCurrentStep((s) => Math.min(5, s + 1));
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleComplete = async () => {
    if (!user || !dominantType) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          neurotype: dominantType,
          onboarding_completed: true,
          onboarding_data: JSON.parse(JSON.stringify(data)),
        })
        .eq("id", user.id);

      if (error) throw error;

      triggerConfetti();
      toast({ title: "Onboarding completato! 🎉", description: "Benvenuto nel tuo programma personalizzato." });
      navigate("/athlete");
    } catch (error) {
      toast({ title: "Errore", description: "Si è verificato un errore. Riprova.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gradient-primary">Athlete Onboarding</h1>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {!showResult && <StepIndicator currentStep={currentStep} totalSteps={5} stepLabels={STEP_LABELS} />}

          <div className="mt-12">
            <AnimatePresence mode="wait">
              {showResult && dominantType ? (
                <NeurotypResult key="result" dominantType={dominantType} scores={scores} onContinue={handleComplete} isSubmitting={isSubmitting} />
              ) : (
                <motion.div key={currentStep}>
                  {currentStep === 1 && <LegalStep data={data.legal} onUpdate={(legal) => setData({ ...data, legal })} />}
                  {currentStep === 2 && <BiometricsStep data={data.biometrics} onUpdate={(biometrics) => setData({ ...data, biometrics })} />}
                  {currentStep === 3 && <LifestyleStep data={data.lifestyle} onUpdate={(lifestyle) => setData({ ...data, lifestyle })} />}
                  {currentStep === 4 && <TrainingStep data={data.training} onUpdate={(training) => setData({ ...data, training })} />}
                  {currentStep === 5 && <NeurotypStep answers={data.neurotypAnswers} onUpdate={(neurotypAnswers) => setData({ ...data, neurotypAnswers })} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {!showResult && (
        <footer className="p-6 border-t border-border bg-card/50">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Indietro
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()} className="gradient-primary">
              {currentStep === 5 ? "Calcola Neurotipo" : "Avanti"} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
