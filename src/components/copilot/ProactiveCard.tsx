import { cn } from "@/lib/utils";

interface ProactiveCardProps {
  /** Etichetta in alto, es: "ANALISI MATTUTINA" — viene resa in uppercase tracking. */
  label: string;
  /** Icona Material Symbols, default `insights`. */
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Card "proattiva" che il Copilot mostra in cima alla schermata
 * (es. analisi mattutina, alert giornaliero).
 *
 * Cifra stilistica: gradiente bianco→viola tenue + glow ambient,
 * per segnalare l'origine AI senza ricorrere a heavy chrome.
 */
export function ProactiveCard({
  label,
  icon = "insights",
  children,
  className,
}: ProactiveCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-br from-white to-violet-50",
        "p-6 border border-violet-100 shadow-ambient",
        "flex flex-col gap-3 relative overflow-hidden backdrop-blur-xl",
        className,
      )}
    >
      {/* Ambient glow nell'angolo */}
      <div
        className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"
        aria-hidden
      />
      <div className="flex items-center gap-2 z-10">
        <span className="material-symbols-outlined text-violet-500 text-[18px]">
          {icon}
        </span>
        <span className="font-label-sm text-label-sm text-violet-500 tracking-widest uppercase">
          {label}
        </span>
      </div>
      <p className="font-body-md text-body-md text-on-surface leading-relaxed z-10">
        {children}
      </p>
    </div>
  );
}
