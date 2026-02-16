import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MetaHead } from "@/components/MetaHead";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGoHome = () => {
    // Navigate to root — RoleRedirect will handle routing
    navigate("/");
  };

  return (
    <>
      <MetaHead title="Pagina non trovata" />
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-4xl font-bold text-primary tabular-nums">404</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Pagina non trovata
            </h1>
            <p className="text-muted-foreground">
              La pagina <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">{location.pathname}</code> non esiste.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>
            <Button onClick={handleGoHome} className="btn-primary-glow gap-2">
              <Home className="h-4 w-4" />
              Torna alla Dashboard
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
