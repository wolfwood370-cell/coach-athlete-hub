import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Textarea — Aura Health System
 * ---------------------------------------------------------------------------
 * Same shape language as `Input` (16px radius, primary focus glow) so
 * multi-line inputs read as the same family on the page.
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-sm ring-offset-background transition-[box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-aura-focus disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
