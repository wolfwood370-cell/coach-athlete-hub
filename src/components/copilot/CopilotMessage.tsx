import { cn } from "@/lib/utils";

interface CopilotMessageProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Bubble per i messaggi dell'AI Copilot.
 * - Avatar circolare con accent viola (segnatura visiva dell'AI).
 * - Bubble grigia chiara con angolo "tail" in alto a sinistra.
 */
export function CopilotMessage({ children, className }: CopilotMessageProps) {
  return (
    <div className={cn("flex gap-3 max-w-[90%]", className)}>
      <div
        className={cn(
          "w-8 h-8 rounded-full bg-violet-100 flex-shrink-0",
          "flex items-center justify-center border border-violet-200/50",
        )}
        aria-hidden
      >
        <span className="material-symbols-outlined text-violet-500 text-[18px]">
          smart_toy
        </span>
      </div>
      <div
        className={cn(
          "bg-surface-container text-on-surface rounded-[20px] rounded-tl-sm",
          "p-4 shadow-sm border border-outline-variant/10",
        )}
      >
        <p className="font-body-md text-body-md leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
