import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { log } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /**
   * Optional custom fallback. When provided, it replaces the default
   * full-screen error UI. Use the function form to read the caught
   * error (e.g. to display a domain-specific message). Use the node
   * form for static fallbacks.
   *
   * The root ErrorBoundary in `main.tsx` keeps its default full-screen
   * fallback; section-level boundaries (CoachLayout, future
   * AthleteLayout) pass a compact fallback so the surrounding
   * navigation chrome stays usable while the page recovers.
   */
  fallback?: ReactNode | ((error: Error) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const error = this.state.error;
      if (fallback) {
        // Function fallbacks are render props — call them with the
        // captured error (default to a generic Error if for some
        // reason getDerivedStateFromError didn't capture one).
        if (typeof fallback === "function") {
          return fallback(error ?? new Error("Unknown error"));
        }
        return fallback;
      }
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-6">
            <span className="text-6xl" role="img" aria-label="error"></span>
            <h1 className="text-2xl font-bold text-foreground">Qualcosa è andato storto</h1>
            <p className="text-muted-foreground">
              Non è colpa tua. Si è verificato un errore imprevisto nell'applicazione.
            </p>
            {error && (
              <pre className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground overflow-auto max-h-32 text-left">
                {error.message}
              </pre>
            )}
            <Button onClick={this.handleReload} className="btn-primary-glow">
              Ricarica App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
