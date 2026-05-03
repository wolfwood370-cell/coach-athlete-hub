import { cn } from "@/lib/utils";

interface RiskAlertCardProps {
  /** Titolo principale dell'alert, default "Risk Detected". */
  title?: string;
  /** Riepilogo dei segnali rilevati (sorenness, sleep, etc.). */
  signals: React.ReactNode;
  /** Implicazione della scelta di proseguire — testo enfatizzato in rosso. */
  consequence: string;
  className?: string;
}

/**
 * Card di alert quando il Copilot rileva un rischio significativo
 * (es. soreness alta + recovery scarso prima di una sessione pesante).
 *
 * Anatomia:
 * - Header con icona triangolo errore in container rosa.
 * - Body con i segnali rilevati (con grassetti per i dati chiave).
 * - Sotto-box `error-container` con la consequenza esplicita.
 */
export function RiskAlertCard({
  title = "Risk Detected",
  signals,
  consequence,
  className,
}: RiskAlertCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white p-6 border border-outline-variant/20",
        "shadow-ambient flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-error-container",
            "flex items-center justify-center shrink-0",
          )}
          aria-hidden
        >
          <span className="material-symbols-outlined text-error text-[20px]">
            warning
          </span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">
          {title}
        </h2>
      </div>

      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {signals}
      </p>

      <div
        className={cn(
          "bg-error-container/60 rounded-md p-4",
          "flex items-start gap-3",
        )}
      >
        <span
          className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5"
          aria-hidden
        >
          info
        </span>
        <p className="font-label-sm text-[13px] text-on-error-container font-semibold leading-snug">
          {consequence}
        </p>
      </div>
    </div>
  );
}
