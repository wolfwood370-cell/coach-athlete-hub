import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone) or dismissed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone || localStorage.getItem(DISMISS_KEY)) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after short delay
    if (ios) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", handler); };
    }

    // For browsers without beforeinstallprompt, show after delay
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt) setShow(true);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") dismiss();
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              Installa l'app
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Tocca l'icona Condividi ↑ poi \"Aggiungi a Home\" per un'esperienza migliore in palestra."
                : "Installa l'app per un'esperienza migliore in palestra."}
            </p>
            {!isIOS && deferredPrompt && (
              <Button size="sm" className="mt-2 h-8 text-xs gap-1.5" onClick={handleInstall}>
                <Download className="h-3.5 w-3.5" />
                Installa ora
              </Button>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
