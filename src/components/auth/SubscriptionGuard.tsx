import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const BYPASS_PATHS = ["/coach/settings", "/coach/business"];
const BLOCKED_STATUSES = ["past_due", "unpaid", "canceled"];

interface Props {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: Props) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Show loading spinner while profile is being fetched
  if (loading) {
    return <LoadingSpinner />;
  }

  // Non-coach users or no profile — pass through
  if (!profile || profile.role !== "coach") {
    return <>{children}</>;
  }

  // Allow settings and billing pages regardless of status
  if (BYPASS_PATHS.some((p) => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const status = profile.subscription_status;
  const tier = (profile as any).subscription_tier as string | null;

  // Free tier or no tier — always allow access
  if (!tier || tier === "free") {
    return <>{children}</>;
  }

  // Null/undefined status — treat as active (legacy fail-safe)
  if (!status) {
    return <>{children}</>;
  }

  // Only block on explicitly problematic statuses
  if (BLOCKED_STATUSES.includes(status)) {
    return (
      <>
        {children}
        <AlertDialog open>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <CreditCard className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-center">
                Pagamento non riuscito
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {status === "past_due"
                  ? "Il tuo ultimo pagamento non è andato a buon fine. Aggiorna il metodo di pagamento per continuare ad usare la piattaforma."
                  : status === "unpaid"
                    ? "Il tuo account risulta non pagato. Aggiorna il metodo di pagamento per ripristinare l'accesso."
                    : "Il tuo abbonamento è stato cancellato. Riattivalo per continuare ad accedere a tutte le funzionalità."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction
                onClick={() => navigate("/coach/business")}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Gestisci Abbonamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // All other statuses (active, trialing, none, etc.) — allow through
  return <>{children}</>;
}
