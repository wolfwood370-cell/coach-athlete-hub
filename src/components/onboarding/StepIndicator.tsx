import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              {/* Step Circle */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 border-2",
                    isCompleted && "bg-success border-success text-success-foreground",
                    isCurrent && "gradient-primary border-primary text-primary-foreground shadow-lg shadow-primary/30",
                    !isCompleted && !isCurrent && "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    stepNumber
                  )}
                </motion.div>
                
                {/* Step Label */}
                <span className={cn(
                  "absolute -bottom-6 text-[10px] font-medium whitespace-nowrap transition-colors",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  {stepLabels[index]}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-border relative overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="absolute inset-0 bg-success origin-left"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
