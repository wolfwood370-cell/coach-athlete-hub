import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";
import { mapSupabaseError } from "@/lib/errorMapping";
import { lovable } from "@/integrations/lovable";
import { MetaHead } from "@/components/MetaHead";
import { Footer } from "@/components/layout/Footer";

export default function Auth() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(mapSupabaseError(result.error));
        setLoading(false);
        return;
      }
      if (result.redirected) {
        // Browser will redirect to Google
        return;
      }
      // Session set — RoleRedirect handles routing
      window.location.href = "/";
    } catch (error: unknown) {
      toast.error(mapSupabaseError(error));
      setLoading(false);
    }
  };

  return (
    <>
      <MetaHead title="Accedi" description="Accedi o registrati alla piattaforma CoachHub." />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">CoachHub</CardTitle>
            <CardDescription>Piattaforma per coaching ibrido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-base font-medium"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
              {loading ? "Accesso in corso..." : "Continua con Google"}
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Accedendo accetti i nostri Termini di Servizio e l'Informativa sulla Privacy.
            </p>
          </CardContent>
        </Card>
        <div className="mt-auto w-full">
          <Footer />
        </div>
      </div>
    </>
  );
}
