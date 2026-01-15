import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAthleteAcwrData } from "@/hooks/useAthleteAcwrData";
import { 
  ArrowLeft, 
  Settings, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  AlertOctagon, 
  Scale, 
  Dumbbell,
  Calendar,
  User,
  ClipboardList,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";

const NEUROTYPE_OPTIONS = [
  { value: "1A", label: "1A - Dominant Dopamine" },
  { value: "1B", label: "1B - Adrenaline Seeker" },
  { value: "2A", label: "2A - Balanced Pleaser" },
  { value: "2B", label: "2B - Anxious Perfectionist" },
  { value: "3", label: "3 - Serotonin Dominant" },
];

interface ProfileFormData {
  full_name: string;
  neurotype: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  injuries_notes: string;
}

export default function AthleteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    neurotype: null,
    height_cm: null,
    weight_kg: null,
    injuries_notes: "",
  });

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

  // Fetch weight trend (daily_metrics)
  const { data: weightTrend } = useQuery({
    queryKey: ["athlete-weight-trend", id],
    queryFn: async () => {
      if (!id) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, weight_kg")
        .eq("user_id", id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data?.filter(d => d.weight_kg !== null) || [];
    },
    enabled: !!id,
  });

  // Fetch latest workout
  const { data: latestWorkout } = useQuery({
    queryKey: ["athlete-latest-workout", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("workout_logs")
        .select(`
          id,
          completed_at,
          rpe_global,
          duration_minutes,
          duration_seconds,
          notes,
          workout_id,
          workouts (title)
        `)
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

  // Fetch active injuries
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

  // ACWR Data
  const { data: acwrData, isLoading: acwrLoading } = useAthleteAcwrData(id);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      const onboardingData = profile.onboarding_data as Record<string, unknown> | null;
      setFormData({
        full_name: profile.full_name || "",
        neurotype: profile.neurotype || null,
        height_cm: (onboardingData?.height as number) || null,
        weight_kg: (onboardingData?.weight as number) || null,
        injuries_notes: (onboardingData?.injuries as string) || "",
      });
    }
  }, [profile]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!id) throw new Error("No athlete ID");
      
      const currentOnboarding = (profile?.onboarding_data as Record<string, unknown>) || {};
      const updatedOnboarding = {
        ...currentOnboarding,
        height: data.height_cm,
        weight: data.weight_kg,
        injuries: data.injuries_notes,
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          neurotype: data.neurotype,
          onboarding_data: updatedOnboarding,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-profile", id] });
      toast.success("Profilo aggiornato con successo");
    },
    onError: (error) => {
      console.error("Error saving profile:", error);
      toast.error("Errore nel salvare il profilo");
    },
  });

  const handleSaveProfile = () => {
    saveProfileMutation.mutate(formData);
  };

  // Determine injury status
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

  // ACWR Status Config
  const getAcwrStatusConfig = () => {
    switch (acwrData?.status) {
      case "optimal":
        return {
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/30",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
        };
      case "high-risk":
        return {
          icon: AlertOctagon,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
        };
      default:
        return {
          icon: Activity,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
        };
    }
  };

  if (profileLoading) {
    return (
      <CoachLayout title="Caricamento..." subtitle="">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </CoachLayout>
    );
  }

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

  const acwrConfig = getAcwrStatusConfig();
  const AcwrIcon = acwrConfig.icon;

  return (
    <CoachLayout 
      title={profile.full_name || "Atleta"} 
      subtitle="Scheda Performance"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/coach/athletes")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al Roster
        </Button>

        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {getInitials(profile.full_name || "A")}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile.full_name || "Nome non disponibile"}
                  </h1>
                  <Badge 
                    variant={athleteStatus === "injured" ? "destructive" : "secondary"}
                    className={cn(
                      "text-xs font-medium",
                      athleteStatus === "active" && "bg-success/10 text-success border-success/30"
                    )}
                  >
                    {athleteStatus === "injured" ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Infortunato
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Attivo
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {profile.neurotype && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      Neurotype: <span className="font-medium text-foreground">{profile.neurotype}</span>
                    </span>
                  )}
                  {latestWorkout?.completed_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Ultimo allenamento:{" "}
                      <span className="font-medium text-foreground">
                        {formatDistanceToNow(new Date(latestWorkout.completed_at), { addSuffix: true, locale: it })}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Settings Button */}
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profilo & Bio
            </TabsTrigger>
            <TabsTrigger value="program" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Programma
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* ACWR Card */}
              <Card className={cn("border-2", acwrConfig.borderColor)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AcwrIcon className={cn("h-4 w-4", acwrConfig.color)} />
                    Rischio ACWR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {acwrLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : acwrData?.status === "insufficient-data" ? (
                    <div className="text-center py-4">
                      <p className="text-2xl font-bold text-muted-foreground">—</p>
                      <p className="text-xs text-muted-foreground mt-1">Dati insufficienti</p>
                    </div>
                  ) : (
                    <div className={cn("rounded-lg p-4", acwrConfig.bgColor)}>
                      <p className={cn("text-3xl font-bold tabular-nums", acwrConfig.color)}>
                        {acwrData?.ratio?.toFixed(2) || "—"}
                      </p>
                      <p className={cn("text-sm font-medium mt-1", acwrConfig.color)}>
                        {acwrData?.label}
                      </p>
                      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                        <span>Acuto: <strong className="text-foreground">{acwrData?.acuteLoad}</strong></span>
                        <span>Cronico: <strong className="text-foreground">{acwrData?.chronicLoad}</strong></span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weight Trend Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    Trend Peso (30gg)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!weightTrend || weightTrend.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                      Nessun dato disponibile
                    </div>
                  ) : (
                    <div className="h-24">
                      <ChartContainer
                        config={{
                          weight: { label: "Peso", color: "hsl(var(--primary))" },
                        }}
                      >
                        <AreaChart data={weightTrend}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="weight_kg"
                            stroke="hsl(var(--primary))"
                            fill="url(#weightGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  )}
                  {weightTrend && weightTrend.length > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Min: {Math.min(...weightTrend.map(w => w.weight_kg!))} kg</span>
                      <span>Max: {Math.max(...weightTrend.map(w => w.weight_kg!))} kg</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Last Workout Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    Ultimo Allenamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!latestWorkout ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">Nessun allenamento completato</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {(latestWorkout.workouts as { title: string } | null)?.title || "Allenamento"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {latestWorkout.completed_at && format(new Date(latestWorkout.completed_at), "d MMMM yyyy, HH:mm", { locale: it })}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        {latestWorkout.rpe_global && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-primary">{latestWorkout.rpe_global}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">RPE</p>
                          </div>
                        )}
                        {(latestWorkout.duration_minutes || latestWorkout.duration_seconds) && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">
                              {latestWorkout.duration_minutes || Math.round((latestWorkout.duration_seconds || 0) / 60)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase">Min</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Active Injuries Section */}
            {hasActiveInjuries && (
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Infortuni Attivi ({injuries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {injuries.map((injury) => (
                      <div 
                        key={injury.id} 
                        className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground">{injury.body_zone}</p>
                          <p className="text-xs text-muted-foreground">
                            {injury.description || "Nessuna descrizione"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {injury.status === "in_rehab" ? "In Riabilitazione" : injury.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile & Bio Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Atleta</CardTitle>
                <CardDescription>
                  Modifica i dati anagrafici e biometrici dell'atleta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Mario Rossi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neurotype">Neurotype</Label>
                    <Select
                      value={formData.neurotype || ""}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, neurotype: value }))}
                    >
                      <SelectTrigger id="neurotype" className="bg-background">
                        <SelectValue placeholder="Seleziona neurotype" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {NEUROTYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Biometrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Altezza (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height_cm || ""}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        height_cm: e.target.value ? Number(e.target.value) : null 
                      }))}
                      placeholder="175"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight_kg || ""}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        weight_kg: e.target.value ? Number(e.target.value) : null 
                      }))}
                      placeholder="70"
                    />
                  </div>
                </div>

                {/* Injuries Notes */}
                <div className="space-y-2">
                  <Label htmlFor="injuries">Note Infortuni / Limitazioni</Label>
                  <Textarea
                    id="injuries"
                    value={formData.injuries_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, injuries_notes: e.target.value }))}
                    placeholder="Es: Precedente infortunio al ginocchio sinistro, evitare carichi elevati..."
                    rows={4}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saveProfileMutation.isPending}
                    className="gradient-primary"
                  >
                    {saveProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salva Modifiche
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Program Tab */}
          <TabsContent value="program" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fase di Allenamento Attuale
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!currentPhase ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Nessuna fase di allenamento attiva per questo atleta
                    </p>
                    <Button 
                      onClick={() => navigate("/coach/periodization")}
                      className="gradient-primary"
                    >
                      Crea Piano di Periodizzazione
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {currentPhase.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {currentPhase.focus_type}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        In Corso
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Inizio</p>
                        <p className="font-medium">
                          {format(new Date(currentPhase.start_date), "d MMM yyyy", { locale: it })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Fine</p>
                        <p className="font-medium">
                          {format(new Date(currentPhase.end_date), "d MMM yyyy", { locale: it })}
                        </p>
                      </div>
                    </div>

                    {currentPhase.notes && (
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Note</p>
                        <p className="text-sm text-foreground">{currentPhase.notes}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => navigate("/coach/programs")}
                        variant="outline"
                        className="w-full"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Apri Program Builder
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CoachLayout>
  );
}
