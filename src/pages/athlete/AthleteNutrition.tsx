import { useState, useEffect, useCallback } from "react";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  Scale,
  TrendingUp,
  Minus,
  Delete,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  ScatterChart,
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

// Macro Ring Component with center text
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
  const remaining = Math.max(target - consumed, 0);
  const radius = 36;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
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
            stroke={bgColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress ring */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ 
              strokeDashoffset,
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
          <span className="text-sm font-bold text-foreground tabular-nums">{remaining}g</span>
          <span className="text-[9px] text-foreground/60">left</span>
        </div>
      </div>
      <p className="text-xs font-medium mt-2 text-foreground/80">{label}</p>
    </div>
  );
}

// Custom Numpad Component
function Numpad({ 
  value, 
  onChange, 
  onDelete, 
  onClear 
}: { 
  value: string;
  onChange: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
  
  const handlePress = (key: string) => {
    if (key === 'C') {
      onClear();
    } else if (key === '⌫') {
      onDelete();
    } else {
      onChange(key);
    }
  };
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <Button
          key={key}
          variant="secondary"
          className={cn(
            "h-14 text-xl font-semibold",
            key === 'C' && "text-foreground/60",
            key === '⌫' && "text-foreground/60"
          )}
          onClick={() => handlePress(key)}
        >
          {key === '⌫' ? <Delete className="h-5 w-5" /> : key}
        </Button>
      ))}
    </div>
  );
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
            backgroundColor: 'hsl(224 71% 8%)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground) / 0.6)' }}
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
          stroke="hsl(262 83% 58%)" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(262 83% 58%)' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function AthleteNutrition() {
  const { user } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"calories" | "macros">("calories");
  const [numpadValue, setNumpadValue] = useState("");
  const [macroValues, setMacroValues] = useState({ p: "", c: "", f: "" });
  const [activeMacro, setActiveMacro] = useState<"p" | "c" | "f">("p");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Nutrition state
  const [consumed, setConsumed] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  
  // Weight data state
  const [weightData, setWeightData] = useState<{ day: number; date: string; scale: number; trend: number }[]>([]);
  const [currentTrend, setCurrentTrend] = useState<number | null>(null);
  const [weightChange, setWeightChange] = useState<number>(0);

  // Fetch today's nutrition logs
  const fetchTodayNutrition = useCallback(async () => {
    if (!user?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('calories, protein, carbs, fats')
      .eq('athlete_id', user.id)
      .eq('date', today);
    
    if (error) {
      console.error('Error fetching nutrition:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const totals = data.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (Number(log.protein) || 0),
        carbs: acc.carbs + (Number(log.carbs) || 0),
        fats: acc.fats + (Number(log.fats) || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
      
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

  // Handle numpad input
  const handleNumpadChange = (digit: string) => {
    if (inputMode === "calories") {
      if (numpadValue.length < 5) {
        setNumpadValue(prev => prev + digit);
      }
    } else {
      const currentValue = macroValues[activeMacro];
      if (currentValue.length < 4) {
        setMacroValues(prev => ({ ...prev, [activeMacro]: prev[activeMacro] + digit }));
      }
    }
  };
  
  const handleNumpadDelete = () => {
    if (inputMode === "calories") {
      setNumpadValue(prev => prev.slice(0, -1));
    } else {
      setMacroValues(prev => ({ 
        ...prev, 
        [activeMacro]: prev[activeMacro].slice(0, -1) 
      }));
    }
  };
  
  const handleNumpadClear = () => {
    if (inputMode === "calories") {
      setNumpadValue("");
    } else {
      setMacroValues(prev => ({ ...prev, [activeMacro]: "" }));
    }
  };

  // Submit nutrition log
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Devi essere loggato");
      return;
    }
    
    setIsSubmitting(true);
    
    let logData: {
      athlete_id: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fats?: number;
    } = {
      athlete_id: user.id,
    };
    
    if (inputMode === "calories") {
      const kcal = parseInt(numpadValue);
      if (!kcal || kcal <= 0) {
        toast.error("Inserisci un valore valido");
        setIsSubmitting(false);
        return;
      }
      logData.calories = kcal;
    } else {
      const p = parseFloat(macroValues.p) || 0;
      const c = parseFloat(macroValues.c) || 0;
      const f = parseFloat(macroValues.f) || 0;
      
      if (p === 0 && c === 0 && f === 0) {
        toast.error("Inserisci almeno un macro");
        setIsSubmitting(false);
        return;
      }
      
      logData.protein = p;
      logData.carbs = c;
      logData.fats = f;
      logData.calories = Math.round(p * 4 + c * 4 + f * 9);
    }
    
    const { error } = await supabase
      .from('nutrition_logs')
      .insert(logData);
    
    if (error) {
      console.error('Error inserting log:', error);
      toast.error("Errore nel salvataggio");
    } else {
      toast.success("Aggiunto!");
      setQuickAddOpen(false);
      setNumpadValue("");
      setMacroValues({ p: "", c: "", f: "" });
      fetchTodayNutrition();
    }
    
    setIsSubmitting(false);
  };

  // Calculated values
  const remaining = nutritionTargets.calories - consumed.calories;
  const consumedPercent = (consumed.calories / nutritionTargets.calories) * 100;
  const isOver = remaining < 0;
  
  // Calculate macros from current input
  const calculatedKcal = inputMode === "macros" 
    ? Math.round(
        (parseFloat(macroValues.p) || 0) * 4 +
        (parseFloat(macroValues.c) || 0) * 4 +
        (parseFloat(macroValues.f) || 0) * 9
      )
    : parseInt(numpadValue) || 0;

  return (
    <AthleteLayout title="Nutrition">
      <div className="space-y-4 p-4 pb-24 animate-fade-in" style={{ backgroundColor: '#0f172a' }}>
        
        {/* ===== ENERGY BALANCE (Hero Widget) ===== */}
        <Card className="border-0 bg-slate-800/50 overflow-hidden">
          <CardContent className="p-5">
            {/* Main number */}
            <div className="text-center mb-5">
              <p className={cn(
                "text-5xl font-bold tabular-nums tracking-tight",
                isOver ? "text-slate-400" : "text-foreground"
              )}>
                {Math.abs(remaining).toLocaleString()}
              </p>
              <p className={cn(
                "text-sm font-medium mt-1",
                isOver ? "text-slate-500" : "text-indigo-400"
              )}>
                kcal {isOver ? "Over" : "Remaining"}
              </p>
            </div>

            {/* Progress Bar - Adherence Neutral */}
            <div className="space-y-2">
              <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    consumedPercent <= 100 
                      ? "bg-gradient-to-r from-indigo-600 to-violet-500" 
                      : "bg-gradient-to-r from-violet-600 to-slate-500"
                  )}
                  style={{ width: `${Math.min(consumedPercent, 100)}%` }}
                />
                {/* Overflow indicator */}
                {consumedPercent > 100 && (
                  <div 
                    className="absolute inset-y-0 right-0 bg-slate-500/80 rounded-r-full"
                    style={{ width: `${Math.min(consumedPercent - 100, 100)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span className="tabular-nums">{consumed.calories.toLocaleString()} consumed</span>
                <span className="tabular-nums">{nutritionTargets.calories.toLocaleString()} target</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== MACRO TARGETS (The Rings) ===== */}
        <Card className="border-0 bg-slate-800/50">
          <CardContent className="p-5">
            <div className="flex justify-around items-center">
              <MacroRing 
                label="Protein" 
                consumed={consumed.protein}
                target={nutritionTargets.protein}
                color="hsl(217 91% 60%)"
                bgColor="hsl(217 91% 60% / 0.2)"
              />
              <MacroRing 
                label="Carbs" 
                consumed={consumed.carbs}
                target={nutritionTargets.carbs}
                color="hsl(38 92% 50%)"
                bgColor="hsl(38 92% 50% / 0.2)"
              />
              <MacroRing 
                label="Fats" 
                consumed={consumed.fats}
                target={nutritionTargets.fats}
                color="hsl(280 70% 60%)"
                bgColor="hsl(280 70% 60% / 0.2)"
              />
            </div>
          </CardContent>
        </Card>

        {/* ===== WEIGHT TREND (Intelligence) ===== */}
        <Card className="border-0 bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-foreground">Weight Trend</span>
              </div>
              {currentTrend && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tabular-nums text-foreground">{currentTrend.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">kg</span>
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-medium ml-1",
                    weightChange < 0 ? "text-violet-400" : weightChange > 0 ? "text-slate-500" : "text-slate-500"
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
                <div className="h-0.5 w-4 rounded bg-violet-500" />
                <span className="text-[10px] text-slate-500">Trend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-foreground/25" />
                <span className="text-[10px] text-slate-500">Bilancia</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <Button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* ===== QUICK ADD DRAWER ===== */}
      <Drawer open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DrawerContent className="athlete-theme h-[60vh]">
          <div className="mx-auto w-full max-w-sm h-full flex flex-col">
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-lg">Quick Add</DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-1 px-4 flex flex-col">
              {/* Toggle Switch */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  inputMode === "calories" ? "text-foreground" : "text-foreground/40"
                )}>
                  Calories
                </span>
                <Switch
                  checked={inputMode === "macros"}
                  onCheckedChange={(checked) => setInputMode(checked ? "macros" : "calories")}
                />
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  inputMode === "macros" ? "text-foreground" : "text-foreground/40"
                )}>
                  Macros
                </span>
              </div>
              
              {/* Display Area */}
              <div className="mb-4">
                {inputMode === "calories" ? (
                  <div className="text-center py-4 rounded-xl bg-secondary/30">
                    <p className="text-4xl font-bold tabular-nums text-foreground">
                      {numpadValue || "0"}
                    </p>
                    <p className="text-xs text-foreground/60 mt-1">kcal</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "p" as const, label: "P", color: "bg-blue-500/20 border-blue-500" },
                      { key: "c" as const, label: "C", color: "bg-amber-500/20 border-amber-500" },
                      { key: "f" as const, label: "F", color: "bg-violet-500/20 border-violet-500" },
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => setActiveMacro(key)}
                        className={cn(
                          "py-3 rounded-xl border-2 transition-all",
                          activeMacro === key ? color : "bg-secondary/30 border-transparent"
                        )}
                      >
                        <p className="text-xs text-foreground/60 mb-1">{label}</p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {macroValues[key] || "0"}
                        </p>
                        <p className="text-[10px] text-foreground/40">g</p>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Calculated kcal for macros mode */}
                {inputMode === "macros" && (
                  <p className="text-center text-sm text-foreground/60 mt-2">
                    = <span className="font-semibold text-foreground">{calculatedKcal}</span> kcal
                  </p>
                )}
              </div>
              
              {/* Numpad */}
              <div className="flex-1">
                <Numpad
                  value={inputMode === "calories" ? numpadValue : macroValues[activeMacro]}
                  onChange={handleNumpadChange}
                  onDelete={handleNumpadDelete}
                  onClear={handleNumpadClear}
                />
              </div>
            </div>

            <DrawerFooter className="pt-2">
              <Button 
                onClick={handleSubmit}
                className="w-full h-12 font-semibold bg-gradient-to-r from-indigo-500 to-violet-600"
                disabled={isSubmitting || calculatedKcal === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Salva
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full text-foreground/60">
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
