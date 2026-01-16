import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Flame, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Save,
  Loader2,
  Plus,
  CheckCircle2,
  Leaf,
  Moon,
  Brain,
  Sparkles,
  Apple,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAuth } from "@/hooks/useAuth";

interface StrategyContentProps {
  athleteId: string | undefined;
}

type StrategyType = 'cut' | 'maintain' | 'bulk';
type HabitCategory = 'recovery' | 'nutrition' | 'mindset';
type HabitFrequency = 'daily' | 'weekly' | 'as_needed';

interface NutritionPlan {
  id: string;
  athlete_id: string;
  coach_id: string;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  strategy_type: StrategyType;
  weekly_weight_goal: number;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface HabitLibraryItem {
  id: string;
  coach_id: string;
  name: string;
  category: HabitCategory;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface AthleteHabit {
  id: string;
  athlete_id: string;
  habit_id: string;
  frequency: HabitFrequency;
  active: boolean;
  created_at: string;
  updated_at: string;
  habit?: HabitLibraryItem;
}

const CATEGORY_CONFIG: Record<HabitCategory, { label: string; icon: React.ElementType; color: string }> = {
  recovery: { label: "Recovery", icon: Moon, color: "text-blue-500" },
  nutrition: { label: "Nutrition", icon: Apple, color: "text-green-500" },
  mindset: { label: "Mindset", icon: Brain, color: "text-purple-500" },
};

const STRATEGY_CONFIG: Record<StrategyType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  cut: { label: "Cut", icon: TrendingDown, color: "text-orange-500", description: "Deficit calorico per perdita peso" },
  maintain: { label: "Maintain", icon: Minus, color: "text-blue-500", description: "Mantenimento peso attuale" },
  bulk: { label: "Bulk", icon: TrendingUp, color: "text-green-500", description: "Surplus calorico per aumento massa" },
};

export function StrategyContent({ athleteId }: StrategyContentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state for nutrition plan
  const [calories, setCalories] = useState(2000);
  const [protein, setProtein] = useState(150);
  const [carbs, setCarbs] = useState(200);
  const [fats, setFats] = useState(70);
  const [strategyType, setStrategyType] = useState<StrategyType>('maintain');
  const [weeklyWeightGoal, setWeeklyWeightGoal] = useState(0);

  // Dialog state
  const [addHabitOpen, setAddHabitOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>("nutrition");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Fetch active nutrition plan for athlete
  const { data: nutritionPlan, isLoading: planLoading } = useQuery({
    queryKey: ["nutrition-plan", athleteId],
    queryFn: async () => {
      if (!athleteId) return null;
      const { data, error } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as NutritionPlan | null;
    },
    enabled: !!athleteId,
  });

  // Update form when plan loads
  useMemo(() => {
    if (nutritionPlan) {
      setCalories(nutritionPlan.daily_calories);
      setProtein(nutritionPlan.protein_g);
      setCarbs(nutritionPlan.carbs_g);
      setFats(nutritionPlan.fats_g);
      setStrategyType(nutritionPlan.strategy_type as StrategyType);
      setWeeklyWeightGoal(Number(nutritionPlan.weekly_weight_goal) || 0);
    }
  }, [nutritionPlan]);

  // Fetch habits library for this coach
  const { data: habitsLibrary, isLoading: habitsLoading } = useQuery({
    queryKey: ["habits-library", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("habits_library")
        .select("*")
        .eq("coach_id", user.id)
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data as HabitLibraryItem[];
    },
    enabled: !!user?.id,
  });

  // Fetch assigned habits for this athlete
  const { data: athleteHabits, isLoading: athleteHabitsLoading } = useQuery({
    queryKey: ["athlete-habits", athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data, error } = await supabase
        .from("athlete_habits")
        .select(`
          *,
          habit:habits_library(*)
        `)
        .eq("athlete_id", athleteId);
      
      if (error) throw error;
      return data as AthleteHabit[];
    },
    enabled: !!athleteId,
  });

  // Save nutrition plan mutation
  const savePlanMutation = useMutation({
    mutationFn: async () => {
      if (!athleteId || !user?.id) throw new Error("Missing IDs");

      // Deactivate existing plans
      if (nutritionPlan) {
        await supabase
          .from("nutrition_plans")
          .update({ active: false })
          .eq("athlete_id", athleteId)
          .eq("active", true);
      }

      // Insert new plan
      const { error } = await supabase
        .from("nutrition_plans")
        .insert({
          athlete_id: athleteId,
          coach_id: user.id,
          daily_calories: calories,
          protein_g: protein,
          carbs_g: carbs,
          fats_g: fats,
          strategy_type: strategyType,
          weekly_weight_goal: weeklyWeightGoal,
          active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-plan", athleteId] });
      toast.success("Strategia nutrizionale salvata!");
    },
    onError: (error) => {
      toast.error("Errore nel salvare la strategia");
      console.error(error);
    },
  });

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("habits_library")
        .insert({
          coach_id: user.id,
          name: newHabitName,
          category: newHabitCategory,
          description: newHabitDescription || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["habits-library"] });
      setNewHabitName("");
      setNewHabitDescription("");
      setSelectedHabitId(data.id);
      toast.success("Habit creato!");
    },
    onError: (error) => {
      toast.error("Errore nella creazione dell'habit");
      console.error(error);
    },
  });

  // Assign habit to athlete mutation
  const assignHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      if (!athleteId) throw new Error("Missing athlete ID");
      
      const { error } = await supabase
        .from("athlete_habits")
        .insert({
          athlete_id: athleteId,
          habit_id: habitId,
          frequency: 'daily',
          active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-habits", athleteId] });
      setAddHabitOpen(false);
      setSelectedHabitId(null);
      toast.success("Habit assegnato!");
    },
    onError: (error) => {
      toast.error("Errore nell'assegnazione dell'habit");
      console.error(error);
    },
  });

  // Toggle habit active state mutation
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, active }: { habitId: string; active: boolean }) => {
      const { error } = await supabase
        .from("athlete_habits")
        .update({ active })
        .eq("id", habitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-habits", athleteId] });
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento dell'habit");
      console.error(error);
    },
  });

  // Remove habit mutation
  const removeHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("athlete_habits")
        .delete()
        .eq("id", habitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-habits", athleteId] });
      toast.success("Habit rimosso");
    },
    onError: (error) => {
      toast.error("Errore nella rimozione dell'habit");
      console.error(error);
    },
  });

  // Calculate macro percentages for pie chart
  const macroData = useMemo(() => {
    const proteinCals = protein * 4;
    const carbsCals = carbs * 4;
    const fatsCals = fats * 9;
    const total = proteinCals + carbsCals + fatsCals;

    return [
      { name: "Proteine", value: Math.round((proteinCals / total) * 100), grams: protein, color: "hsl(var(--chart-1))" },
      { name: "Carboidrati", value: Math.round((carbsCals / total) * 100), grams: carbs, color: "hsl(var(--chart-2))" },
      { name: "Grassi", value: Math.round((fatsCals / total) * 100), grams: fats, color: "hsl(var(--chart-3))" },
    ];
  }, [protein, carbs, fats]);

  // Get habits not yet assigned to this athlete
  const availableHabits = useMemo(() => {
    if (!habitsLibrary || !athleteHabits) return [];
    const assignedIds = new Set(athleteHabits.map(ah => ah.habit_id));
    return habitsLibrary.filter(h => !assignedIds.has(h.id));
  }, [habitsLibrary, athleteHabits]);

  // Group athlete habits by category
  const groupedHabits = useMemo(() => {
    if (!athleteHabits) return {};
    return athleteHabits.reduce((acc, ah) => {
      const category = ah.habit?.category || 'nutrition';
      if (!acc[category]) acc[category] = [];
      acc[category].push(ah);
      return acc;
    }, {} as Record<HabitCategory, AthleteHabit[]>);
  }, [athleteHabits]);

  if (planLoading || habitsLoading || athleteHabitsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section A: Nutrition Protocol */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Protocollo Nutrizionale</CardTitle>
              <CardDescription>Definisci calorie, macro e obiettivo settimanale</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Inputs */}
            <div className="space-y-5">
              {/* Calories */}
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-sm font-medium">
                  Calorie Giornaliere
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-28 text-lg font-semibold"
                  />
                  <span className="text-muted-foreground">kcal</span>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protein" className="text-sm font-medium flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]" />
                    Proteine
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="protein"
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs" className="text-sm font-medium flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" />
                    Carbs
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="carbs"
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats" className="text-sm font-medium flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-3))]" />
                    Grassi
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fats"
                      type="number"
                      value={fats}
                      onChange={(e) => setFats(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Strategy Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fase Goal</Label>
                <Select value={strategyType} onValueChange={(v) => setStrategyType(v as StrategyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STRATEGY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn("h-4 w-4", config.color)} />
                          <span>{config.label}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            — {config.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Weekly Weight Goal Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Variazione Peso Settimanale Target
                  </Label>
                  <Badge variant="outline" className="font-mono">
                    {weeklyWeightGoal > 0 ? "+" : ""}{weeklyWeightGoal.toFixed(1)}%
                  </Badge>
                </div>
                <Slider
                  value={[weeklyWeightGoal]}
                  onValueChange={(v) => setWeeklyWeightGoal(v[0])}
                  min={-1.5}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-1.5% (Cut aggressivo)</span>
                  <span>0%</span>
                  <span>+1.5% (Bulk)</span>
                </div>
              </div>
            </div>

            {/* Right: Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                            <p className="text-sm font-medium">{data.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.grams}g ({data.value}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-sm">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Calculated totals */}
              <div className="text-center mt-2 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Calorie dai macro</p>
                <p className="text-lg font-semibold">
                  {(protein * 4) + (carbs * 4) + (fats * 9)} kcal
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={() => savePlanMutation.mutate()}
              disabled={savePlanMutation.isPending}
            >
              {savePlanMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salva Strategia
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Habit Stacking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Habit Stacking</CardTitle>
                <CardDescription>Assegna abitudini quotidiane da tracciare</CardDescription>
              </div>
            </div>

            {/* Add Habit Dialog */}
            <Dialog open={addHabitOpen} onOpenChange={setAddHabitOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Habit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Aggiungi Habit</DialogTitle>
                  <DialogDescription>
                    Seleziona un habit esistente o creane uno nuovo
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Existing Habits */}
                  {availableHabits.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Dalla tua libreria</Label>
                      <div className="grid gap-2 max-h-48 overflow-y-auto">
                        {availableHabits.map((habit) => {
                          const config = CATEGORY_CONFIG[habit.category];
                          return (
                            <div
                              key={habit.id}
                              onClick={() => setSelectedHabitId(habit.id)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                selectedHabitId === habit.id 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <config.icon className={cn("h-4 w-4", config.color)} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{habit.name}</p>
                                {habit.description && (
                                  <p className="text-xs text-muted-foreground">{habit.description}</p>
                                )}
                              </div>
                              {selectedHabitId === habit.id && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Create New Habit */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Oppure crea nuovo</Label>
                    <Input
                      placeholder="Nome habit (es. Creatine 5g)"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                    />
                    <Select 
                      value={newHabitCategory} 
                      onValueChange={(v) => setNewHabitCategory(v as HabitCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className={cn("h-4 w-4", config.color)} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Descrizione (opzionale)"
                      value={newHabitDescription}
                      onChange={(e) => setNewHabitDescription(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled={!newHabitName.trim() || createHabitMutation.isPending}
                      onClick={() => createHabitMutation.mutate()}
                    >
                      {createHabitMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Crea e Seleziona
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddHabitOpen(false)}>
                    Annulla
                  </Button>
                  <Button 
                    disabled={!selectedHabitId || assignHabitMutation.isPending}
                    onClick={() => selectedHabitId && assignHabitMutation.mutate(selectedHabitId)}
                  >
                    {assignHabitMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Assegna
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!athleteHabits || athleteHabits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Leaf className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nessun habit assegnato</p>
              <p className="text-sm mt-1">
                Clicca "Aggiungi Habit" per iniziare
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(Object.entries(groupedHabits) as [HabitCategory, AthleteHabit[]][]).map(([category, habits]) => {
                const config = CATEGORY_CONFIG[category];
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <config.icon className={cn("h-4 w-4", config.color)} />
                      <span className="text-sm font-medium">{config.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {habits.length}
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      {habits.map((ah) => (
                        <div
                          key={ah.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all",
                            ah.active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={ah.active}
                              onCheckedChange={(checked) => 
                                toggleHabitMutation.mutate({ habitId: ah.id, active: checked })
                              }
                            />
                            <div>
                              <p className={cn(
                                "text-sm font-medium",
                                !ah.active && "line-through text-muted-foreground"
                              )}>
                                {ah.habit?.name}
                              </p>
                              {ah.habit?.description && (
                                <p className="text-xs text-muted-foreground">
                                  {ah.habit.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {ah.frequency === 'daily' ? 'Giornaliero' : 
                               ah.frequency === 'weekly' ? 'Settimanale' : 'Quando serve'}
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Rimuovi habit?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questo habit verrà rimosso dall'atleta. Puoi sempre riassegnarlo in futuro.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeHabitMutation.mutate(ah.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Rimuovi
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
