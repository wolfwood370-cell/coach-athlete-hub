import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  MoreHorizontal,
  Activity,
  Dumbbell,
  BarChart3,
  TrendingUp,
  Scale,
  Camera,
  Settings,
  Pencil,
  Archive,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Brain,
  Calendar,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default function AthleteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch athlete profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["athlete-profile", id],
    queryFn: async () => {
      if (!id) throw new Error("No athlete ID");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch active injuries to determine status
  const { data: injuries } = useQuery({
    queryKey: ["athlete-injuries", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("injuries")
        .select("*")
        .eq("athlete_id", id)
        .neq("status", "healed")
        .order("injury_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch current training phase
  const { data: currentPhase } = useQuery({
    queryKey: ["athlete-current-phase", id],
    queryFn: async () => {
      if (!id) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("training_phases")
        .select("*")
        .eq("athlete_id", id)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch latest workout for "Last Active"
  const { data: latestWorkout } = useQuery({
    queryKey: ["athlete-latest-workout", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("athlete_id", id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Determine status
  const hasActiveInjuries = injuries && injuries.length > 0;
  const athleteStatus = hasActiveInjuries ? "injured" : "active";

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get neurotype label
  const getNeurotypeLabel = (neurotype: string | null) => {
    const types: Record<string, string> = {
      "1A": "1A - Dominant",
      "1B": "1B - Seeker",
      "2A": "2A - Balanced",
      "2B": "2B - Perfectionist",
      "3": "3 - Serotonin",
    };
    return neurotype ? types[neurotype] || neurotype : null;
  };

  // Loading state
  if (profileLoading) {
    return (
      <CoachLayout title="Caricamento..." subtitle="">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </CoachLayout>
    );
  }

  // Not found state
  if (!profile) {
    return (
      <CoachLayout title="Atleta non trovato" subtitle="">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Questo atleta non esiste o non hai accesso.</p>
          <Button onClick={() => navigate("/coach/athletes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna agli Atleti
          </Button>
        </Card>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout title="" subtitle="">
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/coach/athletes")}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al Roster
        </Button>

        {/* Header Section */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Large Avatar */}
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl md:text-3xl font-bold">
                  {getInitials(profile.full_name || "A")}
                </AvatarFallback>
              </Avatar>

              {/* Info Section */}
              <div className="flex-1 space-y-4">
                {/* Name and Status */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {profile.full_name || "Nome non disponibile"}
                  </h1>
                  <Badge 
                    variant={athleteStatus === "injured" ? "destructive" : "secondary"}
                    className={cn(
                      "text-xs font-semibold px-3 py-1 w-fit",
                      athleteStatus === "active" && "bg-success/15 text-success border-success/30 hover:bg-success/20"
                    )}
                  >
                    {athleteStatus === "injured" ? (
                      <>
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Infortunato
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Attivo
                      </>
                    )}
                  </Badge>
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {/* Neurotype Tag */}
                  {profile.neurotype && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <span className="text-muted-foreground">Neurotype:</span>
                      <span className="font-medium text-foreground">{getNeurotypeLabel(profile.neurotype)}</span>
                    </div>
                  )}

                  {/* Program Tag */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Program:</span>
                    <span className="font-medium text-foreground">
                      {currentPhase?.name || "Nessun programma"}
                    </span>
                  </div>

                  {/* Last Active Tag */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Last Active:</span>
                    <span className="font-medium text-foreground">
                      {latestWorkout?.completed_at 
                        ? formatDistanceToNow(new Date(latestWorkout.completed_at), { addSuffix: true, locale: it })
                        : "Mai"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem className="cursor-pointer">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap md:flex-nowrap w-max md:w-full">
              <TabsTrigger value="overview" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="program" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Workout Program</span>
                <span className="sm:hidden">Program</span>
              </TabsTrigger>
              <TabsTrigger value="exercise-stats" className="gap-2 text-xs md:text-sm px-3 py-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Exercise Stats</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="advanced-stats" className="gap-2 text-xs md:text-sm px-3 py-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Advanced Stats</span>
                <span className="sm:hidden">Advanced</span>
              </TabsTrigger>
              <TabsTrigger value="body-metrics" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Body Metrics</span>
                <span className="sm:hidden">Metrics</span>
              </TabsTrigger>
              <TabsTrigger value="progress-pics" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Progress Pics</span>
                <span className="sm:hidden">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents - Placeholders */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-8 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Overview</h3>
              <p className="text-muted-foreground">
                Dashboard panoramica dell'atleta con ACWR, trend peso, ultimo allenamento e infortuni attivi.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="program" className="space-y-6">
            <Card className="p-8 text-center">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Workout Program</h3>
              <p className="text-muted-foreground">
                Gestione del programma di allenamento assegnato all'atleta.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="exercise-stats" className="space-y-6">
            <Card className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exercise Stats</h3>
              <p className="text-muted-foreground">
                Statistiche dettagliate per ogni esercizio: PR, volume, progressione.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="advanced-stats" className="space-y-6">
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Stats</h3>
              <p className="text-muted-foreground">
                Analisi avanzate: frequenza, volume settimanale, distribuzione muscolare.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="body-metrics" className="space-y-6">
            <Card className="p-8 text-center">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Body Metrics</h3>
              <p className="text-muted-foreground">
                Trend peso, composizione corporea, circonferenze.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="progress-pics" className="space-y-6">
            <Card className="p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Progress Pics</h3>
              <p className="text-muted-foreground">
                Galleria foto di progressione fisica nel tempo.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-muted-foreground">
                Impostazioni profilo atleta, notifiche, e gestione account.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CoachLayout>
  );
}
