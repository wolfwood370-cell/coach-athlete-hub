import { cn } from "@/lib/utils";

interface ChatInputProps {
  placeholder?: string;
  className?: string;
}

/**
 * Input area floating fissata in basso (sopra la BottomNav).
 * Layout pill bianco con backdrop-blur, 3 azioni: add, mic, send.
 *
 * Send button è viola — è l'unica azione "AI" e mantiene la firma cromatica.
 *
 * UI statica: niente onSubmit, niente value controllata. Quando colleghi
 * lo stato chat, basta sostituire l'input con un controlled component.
 */
export function ChatInput({
  placeholder = "Chiedimi qualsiasi cosa...",
  className,
}: ChatInputProps) {
  return (
    <div
      className={cn(
        "fixed bottom-[90px] left-0 w-full px-container-padding z-40",
        "flex justify-center pb-4",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-2xl w-full flex items-center gap-2",
          "bg-white/90 backdrop-blur-xl p-2 rounded-full",
          "border border-outline-variant/20",
          "shadow-[0_-5px_30px_rgba(4,53,85,0.05)]",
        )}
      >
        <button
          type="button"
          aria-label="Aggiungi allegato"
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "text-on-surface-variant hover:bg-surface-container",
            "transition-colors active:scale-95",
          )}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <input
          type="text"
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent border-none focus:ring-0",
            "font-body-md text-body-md text-on-surface",
            "placeholder:text-on-surface-variant/50 px-2 h-10",
          )}
        />
        <button
          type="button"
          aria-label="Input vocale"
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "text-on-surface-variant hover:bg-surface-container",
            "transition-colors active:scale-95",
          )}
        >
          <span className="material-symbols-outlined">mic</span>
        </button>
        <button
          type="button"
          aria-label="Invia messaggio"
          className={cn(
            "w-10 h-10 rounded-full bg-violet-500 text-white",
            "flex items-center justify-center hover:bg-violet-600",
            "transition-colors active:scale-95 shadow-sm",
          )}
        >
          <span className="material-symbols-outlined text-[20px] ml-0.5">
            send
          </span>
        </button>
      </div>
    </div>
  );
}
