import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { AlertTriangle, CreditCard, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BYPASS_PATHS = ["/coach/settings", "/coach/business"];
const BLOCKED_STATUSES = ["past_due", "unpaid", "canceled"];

interface Props {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: Props) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile || profile.role !== "coach") {
    return <>{children}</>;
  }

  if (BYPASS_PATHS.some((p) => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const status = profile.subscription_status;
  const tier = (profile as any).subscription_tier as string | null;

  if (!tier || tier === "free") {
    return <>{children}</>;
  }

  if (!status) {
    return <>{children}</>;
  }

  if (BLOCKED_STATUSES.includes(status)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center shadow-lg border-destructive/20">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-xl">Abbonamento in pausa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {status === "past_due"
                ? "Non siamo riusciti a elaborare il tuo ultimo pagamento. Aggiorna il metodo di pagamento per ripristinare l'accesso completo alla piattaforma."
                : status === "unpaid"
                  ? "Il tuo account risulta non pagato. Aggiorna il metodo di pagamento per riprendere ad usare tutte le funzionalità."
                  : "Il tuo abbonamento è stato cancellato. Riattivalo per continuare ad accedere a tutte le funzionalità."}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full gap-2"
              onClick={() => navigate("/coach/business")}
            >
              <CreditCard className="h-4 w-4" />
              Aggiorna Metodo di Pagamento
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              asChild
            >
              <a href="mailto:support@coachathletehub.com">
                <Mail className="h-4 w-4" />
                Contatta il Supporto
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
