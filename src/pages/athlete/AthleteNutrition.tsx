import { useState } from "react";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { 
  Plus,
  Beef,
  Wheat,
  Droplets,
  Scale,
  TrendingUp,
  ChevronRight,
  Utensils,
  Clock,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock nutrition data
const nutritionData = {
  target: {
    calories: 2400,
    protein: 180,
    carbs: 260,
    fats: 75,
  },
  consumed: {
    calories: 1650,
    protein: 125,
    carbs: 180,
    fats: 52,
  },
  meals: [
    { id: 1, name: "Colazione", time: "07:30", calories: 450, logged: true },
    { id: 2, name: "Spuntino", time: "10:30", calories: 200, logged: true },
    { id: 3, name: "Pranzo", time: "13:00", calories: 650, logged: true },
    { id: 4, name: "Spuntino", time: "16:00", calories: 150, logged: true },
    { id: 5, name: "Pre-Workout", time: "17:30", calories: 200, logged: true },
    { id: 6, name: "Cena", time: "20:00", calories: 0, logged: false },
  ]
};

// Mock weight data for trend chart
const weightData = [
  { day: 1, scale: 78.2, trend: 78.5 },
  { day: 2, scale: 78.8, trend: 78.45 },
  { day: 3, scale: 78.0, trend: 78.4 },
  { day: 4, scale: 78.5, trend: 78.35 },
  { day: 5, scale: 77.9, trend: 78.25 },
  { day: 6, scale: 78.3, trend: 78.2 },
  { day: 7, scale: 78.1, trend: 78.15 },
  { day: 8, scale: 77.8, trend: 78.05 },
  { day: 9, scale: 78.4, trend: 78.0 },
  { day: 10, scale: 77.6, trend: 77.9 },
  { day: 11, scale: 77.9, trend: 77.85 },
  { day: 12, scale: 77.5, trend: 77.75 },
  { day: 13, scale: 77.8, trend: 77.7 },
  { day: 14, scale: 77.3, trend: 77.6 },
];

// Weight Trend Chart Component
function WeightTrendChart({ data }: { data: typeof weightData }) {
  const maxWeight = Math.max(...data.map(d => Math.max(d.scale, d.trend)));
  const minWeight = Math.min(...data.map(d => Math.min(d.scale, d.trend)));
  const range = maxWeight - minWeight || 1;
  const padding = range * 0.1;
  
  const getY = (value: number) => {
    return 100 - ((value - minWeight + padding) / (range + padding * 2)) * 100;
  };
  
  const trendPoints = data.map((d, i) => 
    `${(i / (data.length - 1)) * 100},${getY(d.trend)}`
  ).join(' ');

  return (
    <div className="relative h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" className="stroke-border/30" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" className="stroke-border/30" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" className="stroke-border/30" strokeWidth="0.5" />
        
        {/* Trend line */}
        <polyline
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary"
          points={trendPoints}
        />
        
        {/* Scale weight dots */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={(i / (data.length - 1)) * 100}
            cy={getY(d.scale)}
            r="1.5"
            className="fill-muted-foreground/40"
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="absolute top-0 right-0 flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-3 bg-primary rounded" />
          <span className="text-muted-foreground">Trend</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">Scale</span>
        </div>
      </div>
    </div>
  );
}

// Macro Ring Component
function MacroRing({ 
  label, 
  value, 
  target, 
  icon: Icon, 
  color 
}: { 
  label: string;
  value: number;
  target: number;
  icon: React.ElementType;
  color: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  const remaining = target - value;
  const isOver = value > target;
  
  return (
    <div className="text-center">
      <div className="relative inline-block">
        <svg className="h-16 w-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="26"
            strokeWidth="6"
            fill="none"
            className="stroke-secondary"
          />
          <circle
            cx="32"
            cy="32"
            r="26"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 163.4} 163.4`}
            className={cn("transition-all duration-500", color)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-xs font-medium mt-1.5">{label}</p>
      <p className="text-[10px] text-muted-foreground tabular-nums">
        {isOver ? (
          <span>+{value - target}g</span>
        ) : (
          <span>{remaining}g left</span>
        )}
      </p>
    </div>
  );
}

export default function AthleteNutrition() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<"kcal" | "macros">("kcal");
  const [quickKcal, setQuickKcal] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFats, setQuickFats] = useState("");

  const { target, consumed, meals } = nutritionData;
  const remaining = target.calories - consumed.calories;
  const consumedPercent = (consumed.calories / target.calories) * 100;
  
  const currentWeight = weightData[weightData.length - 1];
  const weightChange = currentWeight.trend - weightData[0].trend;

  const handleQuickAdd = () => {
    // In real app, this would add to consumed
    setQuickAddOpen(false);
    setQuickKcal("");
    setQuickProtein("");
    setQuickCarbs("");
    setQuickFats("");
  };

  return (
    <AthleteLayout title="Nutrition">
      <div className="space-y-4 p-4 pb-24 animate-fade-in">
        
        {/* ===== CALORIES REMAINING (Hero Card) ===== */}
        <Card className="border-0 overflow-hidden">
          <CardContent className="p-5">
            <div className="text-center mb-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Calories Remaining
              </p>
              <p className={cn(
                "text-4xl font-bold tabular-nums",
                remaining >= 0 ? "text-foreground" : "text-muted-foreground"
              )}>
                {Math.abs(remaining).toLocaleString()}
              </p>
              {remaining < 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">over target</p>
              )}
            </div>

            {/* Progress Bar - Neutral colors */}
            <div className="space-y-2">
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    consumedPercent <= 100 
                      ? "bg-gradient-to-r from-primary/60 to-primary" 
                      : "bg-gradient-to-r from-primary to-accent"
                  )}
                  style={{ width: `${Math.min(consumedPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="tabular-nums">{consumed.calories.toLocaleString()} consumed</span>
                <span className="tabular-nums">{target.calories.toLocaleString()} target</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== MACRO RINGS ===== */}
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2">
              <MacroRing 
                label="Protein" 
                value={consumed.protein} 
                target={target.protein}
                icon={Beef}
                color="stroke-violet-500"
              />
              <MacroRing 
                label="Carbs" 
                value={consumed.carbs} 
                target={target.carbs}
                icon={Wheat}
                color="stroke-sky-500"
              />
              <MacroRing 
                label="Fats" 
                value={consumed.fats} 
                target={target.fats}
                icon={Droplets}
                color="stroke-amber-500"
              />
            </div>
            
            {/* Macro details */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
              <div className="text-center">
                <p className="text-sm font-semibold tabular-nums">{consumed.protein}g</p>
                <p className="text-[10px] text-muted-foreground">/ {target.protein}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold tabular-nums">{consumed.carbs}g</p>
                <p className="text-[10px] text-muted-foreground">/ {target.carbs}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold tabular-nums">{consumed.fats}g</p>
                <p className="text-[10px] text-muted-foreground">/ {target.fats}g</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== MEALS LOG ===== */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Today's Log</h2>
          </div>
          <Card className="border-0">
            <CardContent className="p-0 divide-y divide-border/50">
              {meals.map((meal) => (
                <div 
                  key={meal.id}
                  className="flex items-center justify-between p-3 active:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      meal.logged ? "bg-primary/10" : "bg-secondary"
                    )}>
                      <Utensils className={cn(
                        "h-4 w-4",
                        meal.logged ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{meal.name}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{meal.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meal.logged ? (
                      <span className="text-sm font-medium tabular-nums">{meal.calories} kcal</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non loggato</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ===== WEIGHT TREND ===== */}
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Weight Trend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tabular-nums">{currentWeight.trend}</span>
                <span className="text-xs text-muted-foreground">kg</span>
                <div className={cn(
                  "flex items-center gap-0.5 text-xs font-medium ml-1",
                  weightChange < 0 ? "text-success" : "text-muted-foreground"
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
            </div>
            
            <WeightTrendChart data={weightData} />
            
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Ultimi 14 giorni · La linea mostra la media mobile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <Button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg gradient-primary z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* ===== QUICK ADD DRAWER ===== */}
      <Drawer open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DrawerContent className="athlete-theme">
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-lg">Quick Add</DrawerTitle>
              <DrawerDescription className="text-xs">
                Aggiungi rapidamente calorie o macro
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4">
              <Tabs value={quickAddTab} onValueChange={(v) => setQuickAddTab(v as "kcal" | "macros")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="kcal">Quick Kcal</TabsTrigger>
                  <TabsTrigger value="macros">Quick Macros</TabsTrigger>
                </TabsList>
                
                <TabsContent value="kcal" className="space-y-4">
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Inserisci calorie
                    </Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={quickKcal}
                      onChange={(e) => setQuickKcal(e.target.value)}
                      className="text-center text-3xl font-bold h-16 bg-secondary border-0"
                    />
                    <p className="text-[10px] text-muted-foreground mt-2">kcal</p>
                  </div>
                  
                  {/* Quick presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 300, 500].map((val) => (
                      <Button
                        key={val}
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuickKcal(String(Number(quickKcal || 0) + val))}
                        className="h-10 text-xs"
                      >
                        +{val}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="macros" className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <Label className="text-[10px] text-muted-foreground mb-1 block">Protein</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={quickProtein}
                        onChange={(e) => setQuickProtein(e.target.value)}
                        className="text-center text-lg font-semibold h-12 bg-secondary border-0"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">g</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-[10px] text-muted-foreground mb-1 block">Carbs</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={quickCarbs}
                        onChange={(e) => setQuickCarbs(e.target.value)}
                        className="text-center text-lg font-semibold h-12 bg-secondary border-0"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">g</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-[10px] text-muted-foreground mb-1 block">Fats</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={quickFats}
                        onChange={(e) => setQuickFats(e.target.value)}
                        className="text-center text-lg font-semibold h-12 bg-secondary border-0"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">g</p>
                    </div>
                  </div>
                  
                  {/* Calculated kcal */}
                  <div className="text-center py-2 rounded-lg bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground">Calorie calcolate</p>
                    <p className="text-lg font-bold tabular-nums">
                      {(Number(quickProtein || 0) * 4) + 
                       (Number(quickCarbs || 0) * 4) + 
                       (Number(quickFats || 0) * 9)} kcal
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DrawerFooter className="pt-4">
              <Button 
                onClick={handleQuickAdd}
                className="w-full h-12 font-semibold gradient-primary"
                disabled={quickAddTab === 'kcal' ? !quickKcal : (!quickProtein && !quickCarbs && !quickFats)}
              >
                Aggiungi
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full">
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
