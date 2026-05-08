import { toast } from "sonner";

/**
 * Map Supabase Edge Function / AI Gateway errors to localized Italian toasts.
 * Looks at FunctionsHttpError.context (Response) when available, else string match.
 */
export async function showAiGatewayError(err: unknown): Promise<void> {
  let status: number | null = null;

  // supabase-js v2 wraps non-2xx responses in FunctionsHttpError with `context`
  const ctx = (err as { context?: Response | { status?: number } } | null)?.context;
  if (ctx && typeof (ctx as Response).status === "number") {
    status = (ctx as Response).status;
  }

  const msg = err instanceof Error ? err.message : String(err ?? "");

  if (status === 429 || /429|rate.?limit/i.test(msg)) {
    toast.error("Limite di richieste raggiunto. Riprova più tardi.");
    return;
  }
  if (status === 402 || /402|credit/i.test(msg)) {
    toast.error("Crediti AI esauriti. Fai l'upgrade del piano.");
    return;
  }
  if (status === 504 || /timeout|aborted|abort/i.test(msg)) {
    toast.error("L'AI sta impiegando troppo tempo. Riprova.");
    return;
  }
  toast.error("Errore AI. Riprova.");
}

/** Wrap a promise with an AbortController-driven 30s timeout. */
export function withTimeout<T>(p: Promise<T>, ms = 30_000, ctrl?: AbortController): Promise<T> {
  const controller = ctrl ?? new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return p.finally(() => clearTimeout(id));
}
