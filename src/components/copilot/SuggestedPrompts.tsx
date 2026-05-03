import { cn } from "@/lib/utils";

interface SuggestedPromptsProps {
  prompts: string[];
  /** Callback quando un prompt viene tappato (UI statica: opzionale). */
  onSelect?: (prompt: string) => void;
  className?: string;
}

/**
 * Carousel orizzontale di prompt suggeriti che il Copilot offre
 * sotto la card proattiva. Stile: chip pill bianchi con border sottile.
 *
 * Usa snap-x per snap-scroll su mobile, scrollbar nascosta.
 */
export function SuggestedPrompts({
  prompts,
  onSelect,
  className,
}: SuggestedPromptsProps) {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 scrollbar-hide",
        "-mx-container-padding px-container-padding snap-x",
        className,
      )}
    >
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect?.(prompt)}
          className={cn(
            "snap-start flex-none px-5 py-2.5 rounded-full",
            "bg-white border border-outline-variant/30",
            "font-label-sm text-label-sm text-on-surface-variant",
            "hover:border-primary/30 hover:bg-surface-container-low",
            "transition-all shadow-sm whitespace-nowrap",
            "active:scale-95 duration-200",
          )}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
