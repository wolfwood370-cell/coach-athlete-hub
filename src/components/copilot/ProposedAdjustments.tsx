import { cn } from "@/lib/utils";

export type AdjustmentKind = "swap" | "reduce" | "add";

export interface Adjustment {
  kind: AdjustmentKind;
  /** Per `swap`: l'esercizio rimosso (renderizzato strikethrough). */
  from?: string;
  /** Per `swap`: l'esercizio sostituto. Per `add`/`reduce`: la descrizione. */
  to: string;
}

interface ProposedAdjustmentsProps {
  adjustments: Adjustment[];
  className?: string;
}

const KIND_META: Record<AdjustmentKind, { icon: string; label: string }> = {
  swap: { icon: "swap_horiz", label: "Sostituzione" },
  reduce: { icon: "trending_down", label: "Riduzione" },
  add: { icon: "add_circle", label: "Aggiunta" },
};

/**
 * Lista di aggiustamenti proposti dal Copilot in risposta a un risk alert.
 *
 * Tre tipi di aggiustamento:
 * - `swap`: sostituzione esercizio (es. Back Squat → Leg Extension).
 * - `reduce`: riduzione volume/intensità.
 * - `add`: aggiunta di mobility, attivazione, recupero.
 */
export function ProposedAdjustments({
  adjustments,
  className,
}: ProposedAdjustmentsProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-container-low p-6",
        "border border-outline-variant/15 flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-primary",
            "flex items-center justify-center shrink-0",
          )}
          aria-hidden
        >
          <span className="material-symbols-outlined text-on-primary text-[20px]">
            auto_awesome
          </span>
        </div>
        <h3 className="font-headline-lg text-headline-lg text-primary">
          Proposed Adjustments
        </h3>
      </div>

      <ul className="flex flex-col gap-3" role="list">
        {adjustments.map((adj, idx) => {
          const meta = KIND_META[adj.kind];
          return (
            <li
              key={idx}
              className={cn(
                "bg-white/80 rounded-md p-4 flex items-start gap-3",
                "border border-outline-variant/10",
              )}
            >
              <span
                className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5"
                aria-label={meta.label}
              >
                {meta.icon}
              </span>
              <div className="flex-1 min-w-0">
                {adj.kind === "swap" && adj.from && (
                  <p className="font-body-md text-body-md text-on-surface-variant line-through mb-1">
                    {adj.from}
                  </p>
                )}
                <p
                  className={cn(
                    "font-body-md text-body-md leading-snug",
                    adj.kind === "swap"
                      ? "text-primary font-semibold"
                      : "text-on-surface",
                  )}
                >
                  {adj.kind === "swap" && (
                    <span className="mr-1" aria-hidden>
                      →
                    </span>
                  )}
                  {adj.to}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
