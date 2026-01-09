import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Users, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  "Dashboard coach con analytics avanzate",
  "App mobile PWA per atleti",
  "Programmazione allenamenti personalizzata",
  "Tracking progressi in tempo reale",
  "Comunicazione coach-atleta integrata",
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">FitCoach</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/coach">Coach Login</Link>
            </Button>
            <Button asChild className="gradient-primary text-white hover:opacity-90">
              <Link to="/athlete">Athlete App</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6">
        <section className="py-20 lg:py-32 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              Piattaforma Fitness Coaching Ibrido
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Il futuro del 
              <span className="text-gradient-primary"> coaching fitness</span> 
              {" "}è qui
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Una piattaforma completa che connette coach e atleti. 
              Dashboard potente per i professionisti, app intuitiva per gli atleti.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild className="gradient-primary text-white hover:opacity-90 h-12 px-8">
                <Link to="/coach">
                  <Users className="h-5 w-5 mr-2" />
                  Entra come Coach
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8">
                <Link to="/athlete">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Prova l'App Atleta
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-t border-border">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">
                Tutto ciò di cui hai bisogno per gestire i tuoi atleti
              </h2>
              <ul className="space-y-4">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="group">
                <Link to="/coach">
                  Scopri la Dashboard Coach
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Preview Cards */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl gradient-hero p-5 text-white hover-lift">
                    <Users className="h-8 w-8 mb-3 opacity-80" />
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-sm opacity-70">Atleti Attivi</p>
                  </div>
                  <div className="rounded-2xl bg-card border p-5 hover-lift">
                    <div className="text-success text-2xl font-bold">87%</div>
                    <p className="text-sm text-muted-foreground">Compliance Media</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="rounded-2xl bg-card border p-5 hover-lift">
                    <div className="text-primary text-2xl font-bold">156</div>
                    <p className="text-sm text-muted-foreground">Workout Settimana</p>
                  </div>
                  <div className="rounded-2xl gradient-primary p-5 text-white hover-lift">
                    <Zap className="h-8 w-8 mb-3 opacity-80" />
                    <p className="text-2xl font-bold">+12%</p>
                    <p className="text-sm opacity-70">Crescita Mensile</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2024 FitCoach. Piattaforma Fitness Coaching.
        </div>
      </footer>
    </div>
  );
}
