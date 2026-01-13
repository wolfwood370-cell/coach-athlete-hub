import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeurotypAnswer, neurotypQuestions } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface NeurotypStepProps {
  answers: NeurotypAnswer[];
  onUpdate: (answers: NeurotypAnswer[]) => void;
}

const answerOptions = [
  { value: 'very_true' as const, label: 'Molto vero' },
  { value: 'mostly_true' as const, label: 'Abbastanza vero' },
  { value: 'somewhat_true' as const, label: 'Un po\' vero' },
  { value: 'not_very_true' as const, label: 'Poco vero' },
  { value: 'not_at_all' as const, label: 'Per niente' },
];

const QUESTIONS_PER_PAGE = 5;

export function NeurotypStep({ answers, onUpdate }: NeurotypStepProps) {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(neurotypQuestions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const currentQuestions = neurotypQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  
  const answeredCount = answers.length;
  const progress = (answeredCount / neurotypQuestions.length) * 100;

  const handleAnswer = (questionIndex: number, value: NeurotypAnswer['value']) => {
    const existingIndex = answers.findIndex(a => a.questionIndex === questionIndex);
    const newAnswer: NeurotypAnswer = { questionIndex, value };
    
    if (existingIndex >= 0) {
      const newAnswers = [...answers];
      newAnswers[existingIndex] = newAnswer;
      onUpdate(newAnswers);
    } else {
      onUpdate([...answers, newAnswer]);
    }
  };

  const getAnswerForQuestion = (questionIndex: number) => {
    return answers.find(a => a.questionIndex === questionIndex)?.value;
  };

  const canGoNext = currentQuestions.every(q => getAnswerForQuestion(q.id - 1) !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-primary/10">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Neurotype Assessment</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Scopri il tuo Neurotipo
        </h2>
        <p className="text-muted-foreground text-sm">
          Rispondi sinceramente - non ci sono risposte giuste o sbagliate
        </p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-xl mx-auto space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{answeredCount} / {neurotypQuestions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Questions */}
      <div className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {currentQuestions.map((question, index) => {
              const globalIndex = question.id - 1;
              const currentAnswer = getAnswerForQuestion(globalIndex);
              
              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3 p-4 rounded-lg bg-card/50 border border-border/50"
                >
                  <div className="flex gap-3">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full h-fit">
                      {question.id}
                    </span>
                    <Label className="text-sm font-medium leading-relaxed">
                      {question.text}
                    </Label>
                  </div>
                  
                  <RadioGroup
                    value={currentAnswer || ''}
                    onValueChange={(value) => handleAnswer(globalIndex, value as NeurotypAnswer['value'])}
                    className="flex flex-wrap gap-2"
                  >
                    {answerOptions.map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={`q${question.id}-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`q${question.id}-${option.value}`}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all border",
                            "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary",
                            "hover:border-primary/50 border-border bg-background"
                          )}
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center max-w-xl mx-auto pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Precedente
        </Button>
        
        <div className="flex gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === currentPage ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage === totalPages - 1 || !canGoNext}
        >
          Successivo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
