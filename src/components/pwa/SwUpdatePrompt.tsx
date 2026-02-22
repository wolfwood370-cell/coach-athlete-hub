import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

/**
 * Listens for service worker updates and shows a toast prompting the user
 * to reload when a new version is available.
 */
export function SwUpdatePrompt() {
  const { toast } = useToast();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Check for updates every 60 minutes
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toast({
      title: "Aggiornamento disponibile",
      description:
        "È disponibile una nuova versione dell'app. Salva il tuo lavoro e ricarica.",
      duration: Infinity,
      action: (
        <Button
          variant="default"
          size="sm"
          onClick={() => updateServiceWorker(true)}
        >
          Ricarica
        </Button>
      ),
    });
  }, [needRefresh, toast, updateServiceWorker]);

  return null;
}
