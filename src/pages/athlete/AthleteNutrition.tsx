import { useState, useEffect, useCallback } from "react";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { 
  Plus,
  Zap,
  Scale,
  TrendingUp,
  Minus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FoodDatabase } from "@/components/nutrition/FoodDatabase";
import {
  Line,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ComposedChart,
  Tooltip,
} from "recharts";

// Nutrition targets (would come from user profile in production)
const nutritionTargets = {
  calories: 2400,
  protein: 180,
  carbs: 260,
  fats: 75,
  water: 2500,
};

// Calculate EMA (Exponential Moving Average)
const calculateEMA = (data: number[], smoothing: number = 0.2): number[] => {
  if (data.length === 0) return [];
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * smoothing + ema[i - 1] * (1 - smoothing));
  }
  return ema;
};

// Macro Ring Component with center text and soft alert for excess
function MacroRing({ 
  label, 
  consumed, 
  target, 
  color,
  bgColor
}: { 
  label: string;
  consumed: number;
  target: number;
  color: string;
  bgColor: string;
}) {
  const percentage = Math.min((consumed / target) * 100, 100);
  const delta = target - consumed;
  const isOver = delta < 0;
  const radius = 36;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Amber color for excess
  const amberColor = "hsl(38 92% 50%)";
  const amberBgColor = "hsl(38 92% 50% / 0.2)";
  
  const activeColor = isOver ? amberColor : color;
  const activeBgColor = isOver ? amberBgColor : bgColor;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            stroke={activeBgColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress ring */}
          <circle
            stroke={activeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ 
              strokeDashoffset: isOver ? 0 : strokeDashoffset,
              transition: "stroke-dashoffset 0.5s ease-out"
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-sm font-bold tabular-nums",
            isOver ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          )}>
            {Math.abs(delta)}g
          </span>
          <span className={cn(
            "text-[9px]",
            isOver ? "text-amber-600 dark:text-amber-400" : "text-foreground/60"
          )}>
            {isOver ? "in eccesso" : "rimasti"}
          </span>
        </div>
      </div>
      <p className="text-xs font-medium mt-2 text-foreground/80">{label}</p>
    </div>
  );
}

// Quick Add Form state interface
interface QuickAddFormState {
  name: string;
  protein: string;
  fat: string;
  carbs: string;
  fiber: string;
  salt: string;
  water: string;
  caloriesOverride: string;
}

// Weight Trend Chart with recharts
function WeightTrendChart({ data }: { data: { day: number; date: string; scale: number; trend: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-foreground/40 text-sm">
        Nessun dato peso disponibile
      </div>
    );
  }

  const minWeight = Math.min(...data.map(d => Math.min(d.scale, d.trend))) - 0.5;
  const maxWeight = Math.max(...data.map(d => Math.max(d.scale, d.trend))) + 0.5;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis 
          dataKey="day" 
          tick={{ fontSize: 10, fill: 'hsl(var(--foreground) / 0.4)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          domain={[minWeight, maxWeight]}
          tick={{ fontSize: 10, fill: 'hsl(var(--foreground) / 0.4)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          formatter={(value: number, name: string) => [
            `${value.toFixed(1)} kg`,
            name === 'scale' ? 'Bilancia' : 'Trend'
          ]}
        />
        {/* Scale weight as scattered dots (noise) */}
        <Scatter 
          dataKey="scale" 
          fill="hsl(var(--foreground) / 0.25)" 
          shape="circle"
        />
        {/* Trend line (signal) */}
        <Line 
          type="monotone" 
          dataKey="trend" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function AthleteNutrition() {
  const { user } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [foodDbOpen, setFoodDbOpen] = useState(false);
  const [showSecondFab, setShowSecondFab] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick Add form state
  const [formData, setFormData] = useState<QuickAddFormState>({
    name: "",
    protein: "",
    fat: "",
    carbs: "",
    fiber: "",
    salt: "",
    water: "",
    caloriesOverride: "",
  });
  
  // Nutrition state
  const [consumed, setConsumed] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
  });
  
  // Weight data state
  const [weightData, setWeightData] = useState<{ day: number; date: string; scale: number; trend: number }[]>([]);
  const [currentTrend, setCurrentTrend] = useState<number | null>(null);
  const [weightChange, setWeightChange] = useState<number>(0);

  // Calculate calories from macros
  const calculatedKcal = Math.round(
    (parseFloat(formData.protein) || 0) * 4 +
    (parseFloat(formData.carbs) || 0) * 4 +
    (parseFloat(formData.fat) || 0) * 9
  );
  
  // Use override if provided, otherwise use calculated
  const displayKcal = formData.caloriesOverride 
    ? parseInt(formData.caloriesOverride) || 0 
    : calculatedKcal;

  // Fetch today's nutrition logs
  const fetchTodayNutrition = useCallback(async () => {
    if (!user?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('calories, protein, carbs, fats, water')
      .eq('athlete_id', user.id)
      .eq('date', today);
    
    if (error) {
      console.error('Error fetching nutrition:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const totals = data.reduce<{ calories: number; protein: number; carbs: number; fats: number; water: number }>((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (Number(log.protein) || 0),
        carbs: acc.carbs + (Number(log.carbs) || 0),
        fats: acc.fats + (Number(log.fats) || 0),
        water: acc.water + (Number(log.water) || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 });
      
      setConsumed(totals);
    }
  }, [user?.id]);

  // Fetch weight data for trend chart
  const fetchWeightData = useCallback(async () => {
    if (!user?.id) return;
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const { data, error } = await supabase
      .from('daily_readiness')
      .select('date, body_weight')
      .eq('athlete_id', user.id)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching weight:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const weights = data
        .filter(d => d.body_weight !== null)
        .map(d => Number(d.body_weight));
      
      if (weights.length > 0) {
        const ema = calculateEMA(weights, 0.3);
        
        const chartData = data
          .filter(d => d.body_weight !== null)
          .map((d, i) => ({
            day: i + 1,
            date: d.date,
            scale: Number(d.body_weight),
            trend: Number(ema[i].toFixed(1)),
          }));
        
        setWeightData(chartData);
        setCurrentTrend(ema[ema.length - 1]);
        setWeightChange(ema[ema.length - 1] - ema[0]);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTodayNutrition();
    fetchWeightData();
  }, [fetchTodayNutrition, fetchWeightData]);

  // Handle form field change
  const handleFieldChange = (field: keyof QuickAddFormState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      protein: "",
      fat: "",
      carbs: "",
      fiber: "",
      salt: "",
      water: "",
      caloriesOverride: "",
    });
  };

  // Submit nutrition log
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Devi essere loggato");
      return;
    }
    
    const finalCalories = displayKcal;
    const p = parseFloat(formData.protein) || 0;
    const c = parseFloat(formData.carbs) || 0;
    const f = parseFloat(formData.fat) || 0;
    const fib = parseFloat(formData.fiber) || 0;
    const salt = parseFloat(formData.salt) || 0;
    const water = parseFloat(formData.water) || 0;
    
    // At least one value must be filled
    if (finalCalories === 0 && p === 0 && c === 0 && f === 0 && fib === 0 && salt === 0 && water === 0) {
      toast.error("Inserisci almeno un valore");
      return;
    }
    
    setIsSubmitting(true);
    
    const logData = {
      athlete_id: user.id,
      calories: finalCalories,
      protein: p || null,
      carbs: c || null,
      fats: f || null,
      water: water || null,
      meal_name: null,
    };
    
    const { error } = await supabase
      .from('nutrition_logs')
      .insert(logData);
    
    if (error) {
      console.error('Error inserting log:', error);
      toast.error("Errore nel salvataggio");
    } else {
      toast.success("Aggiunto!");
      setQuickAddOpen(false);
      resetForm();
      fetchTodayNutrition();
    }
    
    setIsSubmitting(false);
  };

  // Calculated values
  const remaining = nutritionTargets.calories - consumed.calories;
  const consumedPercent = (consumed.calories / nutritionTargets.calories) * 100;
  const isOver = remaining < 0;

  return (
    <AthleteLayout title="Nutrition">
      <div className="space-y-4 p-4 pb-24 animate-fade-in">
        
        {/* ===== ENERGY BALANCE (Hero Widget) ===== */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-5">
            {/* Main number */}
            <div className="text-center mb-5">
              <p className={cn(
                "text-5xl font-bold tabular-nums tracking-tight",
                isOver ? "text-amber-600 dark:text-amber-400" : "text-foreground"
              )}>
                {Math.abs(remaining).toLocaleString()}
              </p>
              <p className={cn(
                "text-sm font-medium mt-1",
                isOver ? "text-amber-600 dark:text-amber-400" : "text-primary"
              )}>
                kcal {isOver ? "in eccesso" : "rimanenti"}
              </p>
            </div>

            {/* Progress Bar - Soft Alert with Amber for excess */}
            <div className="space-y-2">
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    isOver 
                      ? "bg-gradient-to-r from-amber-500 to-amber-400" 
                      : "bg-gradient-to-r from-primary to-primary/70"
                  )}
                  style={{ width: `${Math.min(consumedPercent, 100)}%` }}
                />
                {/* Overflow indicator - amber for excess */}
                {consumedPercent > 100 && (
                  <div 
                    className="absolute inset-y-0 right-0 bg-amber-400/50 rounded-r-full"
                    style={{ width: `${Math.min(consumedPercent - 100, 100)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">{consumed.calories.toLocaleString()} consumate</span>
                <span className="tabular-nums">{nutritionTargets.calories.toLocaleString()} obiettivo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== MACRO TARGETS (The Rings) ===== */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-5">
            <div className="flex justify-around items-center">
              <MacroRing 
                label="Proteine" 
                consumed={consumed.protein}
                target={nutritionTargets.protein}
                color="hsl(0 84% 60%)"
                bgColor="hsl(0 84% 60% / 0.2)"
              />
              <MacroRing 
                label="Carboidrati" 
                consumed={consumed.carbs}
                target={nutritionTargets.carbs}
                color="hsl(142 71% 45%)"
                bgColor="hsl(142 71% 45% / 0.2)"
              />
              <MacroRing 
                label="Grassi" 
                consumed={consumed.fats}
                target={nutritionTargets.fats}
                color="hsl(45 93% 47%)"
                bgColor="hsl(45 93% 47% / 0.2)"
              />
            </div>
            
            {/* Water Progress Bar - Always positive, no amber alerts */}
            <div className="mt-5 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground/70">Acqua</span>
                <span className={cn(
                  "text-xs",
                  (consumed.water || 0) >= nutritionTargets.water 
                    ? "text-cyan-600 dark:text-cyan-400 font-medium" 
                    : "text-foreground/50"
                )}>
                  {(consumed.water || 0) >= nutritionTargets.water 
                    ? "✓ Obiettivo raggiunto!" 
                    : `${consumed.water || 0} / ${nutritionTargets.water} ml`}
                </span>
              </div>
              <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-gradient-to-r from-sky-500 to-cyan-400"
                  style={{ width: `${Math.min(((consumed.water || 0) / nutritionTargets.water) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== WEIGHT TREND (Intelligence) ===== */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Andamento Peso</span>
              </div>
              {currentTrend && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tabular-nums text-foreground">{currentTrend.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">kg</span>
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-medium ml-1",
                    weightChange < 0 ? "text-primary" : weightChange > 0 ? "text-muted-foreground" : "text-muted-foreground"
                  )}>
                    {weightChange < 0 ? (
                      <TrendingUp className="h-3 w-3 rotate-180" />
                    ) : weightChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    <span className="tabular-nums">{Math.abs(weightChange).toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <WeightTrendChart data={weightData} />
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded bg-primary" />
                <span className="text-[10px] text-muted-foreground">Trend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-foreground/25" />
                <span className="text-[10px] text-muted-foreground">Bilancia</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== FLOATING ACTION BUTTONS ===== */}
      {/* Secondary FAB - Food Database (appears when primary is clicked) */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 transition-all duration-300 ease-out",
          showSecondFab ? "translate-x-[-72px] opacity-100" : "translate-x-0 opacity-0 pointer-events-none"
        )}
      >
        <Button
          onClick={() => {
            setFoodDbOpen(true);
            setShowSecondFab(false);
          }}
          className="h-14 w-14 rounded-full shadow-xl bg-emerald-400 hover:bg-emerald-500"
          size="icon"
        >
          <Search className="h-6 w-6 text-violet-700" />
        </Button>
      </div>
      
      {/* Primary FAB - toggles menu or opens quick add */}
      <Button
        onClick={() => {
          if (showSecondFab) {
            setQuickAddOpen(true);
            setShowSecondFab(false);
          } else {
            setShowSecondFab(true);
          }
        }}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-xl z-40 transition-all duration-200 bg-primary hover:bg-primary/90"
        size="icon"
      >
        {showSecondFab ? (
          <Zap className="h-6 w-6 transition-transform duration-200" />
        ) : (
          <Plus className="h-6 w-6 transition-transform duration-200" />
        )}
      </Button>
      
      {/* Backdrop when FAB menu is open */}
      {showSecondFab && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowSecondFab(false)}
        />
      )}

      {/* ===== FOOD DATABASE DRAWER ===== */}
      <FoodDatabase
        open={foodDbOpen}
        onOpenChange={setFoodDbOpen}
        onFoodLogged={fetchTodayNutrition}
      />

      {/* ===== QUICK ADD DRAWER ===== */}
      <Drawer open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-md flex flex-col overflow-hidden">
            <DrawerHeader className="text-center pb-2 shrink-0">
              <DrawerTitle className="text-lg">Aggiunta Rapida</DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-1 px-4 overflow-y-auto space-y-4 pb-4">
              {/* Energy Field with Unit Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Energia</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={calculatedKcal > 0 ? `${calculatedKcal} (auto)` : "0"}
                    value={formData.caloriesOverride}
                    onChange={(e) => handleFieldChange("caloriesOverride", e.target.value)}
                    className="flex-1 bg-secondary/60 border-border h-12 text-base"
                  />
                  <div className="flex items-center justify-center px-4 bg-secondary/60 border border-border rounded-md text-sm text-muted-foreground">
                    kcal
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  Somma macro: {calculatedKcal} kcal
                </p>
              </div>
              
              {/* Macro Row: Protein, Fat, Carbs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Proteine</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.protein}
                      onChange={(e) => handleFieldChange("protein", e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">g</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Grassi</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.fat}
                      onChange={(e) => handleFieldChange("fat", e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">g</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Carboidrati</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.carbs}
                      onChange={(e) => handleFieldChange("carbs", e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">g</span>
                  </div>
                </div>
              </div>
              
              {/* Additional fields row: Fiber, Salt, Water */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fibre</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.fiber}
                      onChange={(e) => handleFieldChange("fiber", e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">g</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sale</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.salt}
                      onChange={(e) => handleFieldChange("salt", e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">g</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Acqua</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.water}
                      onChange={(e) => handleFieldChange("water", e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">ml</span>
                  </div>
                </div>
              </div>
              
            </div>

            <DrawerFooter className="pt-2 shrink-0 border-t border-border/50">
              <Button 
                onClick={handleSubmit}
                className="w-full h-12 font-semibold bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                Aggiungi
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full text-primary hover:text-primary/80 hover:bg-primary/10 text-sm">
                  Annulla
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </AthleteLayout>
  );
}
