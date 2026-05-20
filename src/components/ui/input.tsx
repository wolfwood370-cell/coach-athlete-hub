import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — Aura Health System
 * ---------------------------------------------------------------------------
 * DESIGN.md rules:
 *  - 16px radius (`rounded-2xl`) — matches the card language while
 *    keeping the field's role distinct from buttons (pill-shaped).
 *  - `--outline-variant` border by default; transitions to `--primary`
 *    on focus, with an ambient outer glow (`shadow-aura-focus`).
 *  - `--background` surface keeps the field flush with the page tone.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-2xl border border-outline-variant bg-background px-4 py-2 text-base ring-offset-background transition-[box-shadow,border-color] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-aura-focus disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
