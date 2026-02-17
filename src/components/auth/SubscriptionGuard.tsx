import { useAuth } from "@/hooks/useAuth";
import { useLocation, Navigate } from "react-router-dom";
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

const BYPASS_PATHS = ["/coach/settings", "/coach/business"];

interface Props {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: Props) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't block while loading or for non-coach users
  if (loading || !profile || profile.role !== "coach") {
    return <>{children}</>;
  }

  // Allow settings and billing pages regardless of status
  if (BYPASS_PATHS.some((p) => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const status = profile.subscription_status;

  // Active or trialing — allow through
  if (status === "active" || status === "trialing" || !status) {
    return <>{children}</>;
  }

  // past_due or canceled — show blocking modal
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
