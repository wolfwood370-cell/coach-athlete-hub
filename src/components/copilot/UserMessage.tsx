import { cn } from "@/lib/utils";

interface UserMessageProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Bubble per i messaggi inviati dall'utente nella chat Copilot.
 * Allineata a destra, sfondo `primary` con angolo "tail" in alto a destra.
 */
export function UserMessage({ children, className }: UserMessageProps) {
  return (
    <div className={cn("flex justify-end", className)}>
      <div className="bg-primary text-on-primary rounded-[20px] rounded-tr-sm p-4 max-w-[85%] shadow-sm">
        <p className="font-body-md text-body-md">{children}</p>
      </div>
    </div>
  );
}
