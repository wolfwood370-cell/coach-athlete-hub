import { AlertTriangle } from "lucide-react";

interface ExitWorkoutDialogProps {
  isOpen: boolean;
  onResume: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  timerDuration: string;
}

export function ExitWorkoutDialog({
  isOpen,
  onResume,
  onFinish,
  onDiscard,
  timerDuration,
}: ExitWorkoutDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/40 backdrop-blur-[20px] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-workout-title"
    >
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 flex flex-col items-center border border-surface-variant/50">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
          <AlertTriangle className="size-8 text-primary" />
        </div>

        <h2
          id="exit-workout-title"
          className="font-display text-xl font-bold text-on-surface text-center mb-2"
        >
          Pausa o Termina Allenamento?
        </h2>

        <p className="font-body text-sm text-on-surface-variant text-center mb-8">
          Il timer globale è attualmente a{" "}
          <span className="font-bold">{timerDuration}</span>. Cosa desideri fare?
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full bg-primary-container text-white rounded-xl py-4 font-bold text-base flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Riprendi Allenamento
          </button>

          <button
            type="button"
            onClick={onFinish}
            className="w-full bg-surface-container text-primary-container rounded-xl py-4 font-bold text-base flex items-center justify-center hover:bg-surface-container-high active:scale-[0.98] transition-all"
          >
            Termina e Salva Dati
          </button>

          <button
            type="button"
            onClick={onDiscard}
            className="w-full text-error font-bold text-xs mt-4 tracking-wider text-center uppercase hover:opacity-80 transition-opacity"
          >
            Scarta Allenamento
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExitWorkoutDialog;
