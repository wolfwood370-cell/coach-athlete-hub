import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Plus, ChevronLeft, Search, Trash2, Globe, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { searchFood, type FoodItem } from "@/services/foodApi";
import { useDebounce } from "@/hooks/useDebounce";

interface CustomFood {
  id: string;
  name: string;
  energy_kcal: number | null;
  energy_kj: number | null;
  fat: number | null;
  saturated_fat: number | null;
  carbs: number | null;
  sugars: number | null;
  protein: number | null;
  salt: number | null;
  fiber: number | null;
  vitamin_a: number | null;
  vitamin_d: number | null;
  vitamin_e: number | null;
  vitamin_k: number | null;
  vitamin_c: number | null;
  thiamine_b1: number | null;
  riboflavin_b2: number | null;
  niacin_b3: number | null;
  vitamin_b6: number | null;
  folic_acid_b9: number | null;
  vitamin_b12: number | null;
  biotin_b7: number | null;
  pantothenic_acid_b5: number | null;
}

interface NewFoodForm {
  name: string;
  energy_kcal: string;
  fat: string;
  saturated_fat: string;
  carbs: string;
  sugars: string;
  protein: string;
  salt: string;
  fiber: string;
  vitamin_a: string;
  vitamin_d: string;
  vitamin_e: string;
  vitamin_k: string;
  vitamin_c: string;
  thiamine_b1: string;
  riboflavin_b2: string;
  niacin_b3: string;
  vitamin_b6: string;
  folic_acid_b9: string;
  vitamin_b12: string;
  biotin_b7: string;
  pantothenic_acid_b5: string;
}

const initialFormState: NewFoodForm = {
  name: "",
  energy_kcal: "",
  fat: "",
  saturated_fat: "",
  carbs: "",
  sugars: "",
  protein: "",
  salt: "",
  fiber: "",
  vitamin_a: "",
  vitamin_d: "",
  vitamin_e: "",
  vitamin_k: "",
  vitamin_c: "",
  thiamine_b1: "",
  riboflavin_b2: "",
  niacin_b3: "",
  vitamin_b6: "",
  folic_acid_b9: "",
  vitamin_b12: "",
  biotin_b7: "",
  pantothenic_acid_b5: "",
};

interface FoodDatabaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodLogged: () => void;
}

// Unified food type for display
interface UnifiedFood {
  id: string;
  name: string;
  brand?: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  salt: number | null;
  source: 'custom' | 'api';
}

export function FoodDatabase({ open, onOpenChange, onFoodLogged }: FoodDatabaseProps) {
  const { user } = useAuth();
  const [view, setView] = useState<'search' | 'create' | 'log'>('search');
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<UnifiedFood | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [formData, setFormData] = useState<NewFoodForm>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [apiResults, setApiResults] = useState<FoodItem[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 500);

  const fetchCustomFoods = useCallback(async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('athlete_id', user.id)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching foods:', error);
      return;
    }
    
    setCustomFoods(data || []);
  }, [user?.id]);

  // Fetch custom foods on open
  useEffect(() => {
    if (open) {
      fetchCustomFoods();
      setView('search');
      setSelectedFood(null);
      setQuantity("100");
      setSearchQuery("");
      setApiResults([]);
    }
  }, [open, fetchCustomFoods]);

  // Hybrid search: when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setApiResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchFood(debouncedQuery);
        setApiResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    performSearch();
  }, [debouncedQuery]);

  // Filter custom foods locally
  const filteredCustomFoods = customFoods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert custom foods to unified format
  const unifiedCustomFoods: UnifiedFood[] = filteredCustomFoods.map(food => ({
    id: food.id,
    name: food.name,
    brand: null,
    calories: food.energy_kcal,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fat,
    fiber: food.fiber,
    salt: food.salt,
    source: 'custom' as const,
  }));

  // Convert API results to unified format
  const unifiedApiResults: UnifiedFood[] = apiResults.map(food => ({
    id: food.id,
    name: food.name,
    brand: food.brand,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fats,
    fiber: food.fiber,
    salt: food.salt,
    source: 'api' as const,
  }));

  // Calculate calories from macros
  const calculatedKcal = Math.round(
    (parseFloat(formData.protein) || 0) * 4 +
    (parseFloat(formData.carbs) || 0) * 4 +
    (parseFloat(formData.fat) || 0) * 9
  );

  const handleFieldChange = (field: keyof NewFoodForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateFood = async (autoSelectAfter: boolean = false) => {
    if (!user?.id) {
      toast.error("Devi essere loggato");
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error("Inserisci il nome del cibo");
      return;
    }
    
    setIsSubmitting(true);
    
    // Use manual kcal if provided, otherwise use calculated from macros
    const finalKcal = formData.energy_kcal 
      ? parseFloat(formData.energy_kcal) 
      : (calculatedKcal > 0 ? calculatedKcal : null);

    const foodData = {
      athlete_id: user.id,
      name: formData.name.trim(),
      energy_kcal: finalKcal,
      fat: formData.fat ? parseFloat(formData.fat) : null,
      saturated_fat: formData.saturated_fat ? parseFloat(formData.saturated_fat) : null,
      carbs: formData.carbs ? parseFloat(formData.carbs) : null,
      sugars: formData.sugars ? parseFloat(formData.sugars) : null,
      protein: formData.protein ? parseFloat(formData.protein) : null,
      salt: formData.salt ? parseFloat(formData.salt) : null,
      fiber: formData.fiber ? parseFloat(formData.fiber) : null,
      vitamin_a: formData.vitamin_a ? parseFloat(formData.vitamin_a) : null,
      vitamin_d: formData.vitamin_d ? parseFloat(formData.vitamin_d) : null,
      vitamin_e: formData.vitamin_e ? parseFloat(formData.vitamin_e) : null,
      vitamin_k: formData.vitamin_k ? parseFloat(formData.vitamin_k) : null,
      vitamin_c: formData.vitamin_c ? parseFloat(formData.vitamin_c) : null,
      thiamine_b1: formData.thiamine_b1 ? parseFloat(formData.thiamine_b1) : null,
      riboflavin_b2: formData.riboflavin_b2 ? parseFloat(formData.riboflavin_b2) : null,
      niacin_b3: formData.niacin_b3 ? parseFloat(formData.niacin_b3) : null,
      vitamin_b6: formData.vitamin_b6 ? parseFloat(formData.vitamin_b6) : null,
      folic_acid_b9: formData.folic_acid_b9 ? parseFloat(formData.folic_acid_b9) : null,
      vitamin_b12: formData.vitamin_b12 ? parseFloat(formData.vitamin_b12) : null,
      biotin_b7: formData.biotin_b7 ? parseFloat(formData.biotin_b7) : null,
      pantothenic_acid_b5: formData.pantothenic_acid_b5 ? parseFloat(formData.pantothenic_acid_b5) : null,
    };
    
    const { data, error } = await supabase
      .from('custom_foods')
      .insert(foodData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating food:', error);
      toast.error("Errore nel salvataggio");
    } else {
      toast.success("Cibo creato!");
      setFormData(initialFormState);
      await fetchCustomFoods();
      
      if (autoSelectAfter && data) {
        // Auto-select the newly created food for logging
        const newFood: UnifiedFood = {
          id: data.id,
          name: data.name,
          brand: null,
          calories: data.energy_kcal,
          protein: data.protein,
          carbs: data.carbs,
          fats: data.fat,
          fiber: data.fiber,
          salt: data.salt,
          source: 'custom',
        };
        setSelectedFood(newFood);
        setQuantity("100");
        setView('log');
      } else {
        setView('search');
      }
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('custom_foods')
      .delete()
      .eq('id', foodId)
      .eq('athlete_id', user.id);
    
    if (error) {
      console.error('Error deleting food:', error);
      toast.error("Errore nell'eliminazione");
    } else {
      toast.success("Cibo eliminato!");
      await fetchCustomFoods();
    }
  };

  const handleLogFood = async () => {
    if (!user?.id || !selectedFood) return;
    
    const qty = parseFloat(quantity) || 100;
    const multiplier = qty / 100;
    
    const logData = {
      athlete_id: user.id,
      calories: Math.round((selectedFood.calories || 0) * multiplier),
      protein: selectedFood.protein ? selectedFood.protein * multiplier : null,
      carbs: selectedFood.carbs ? selectedFood.carbs * multiplier : null,
      fats: selectedFood.fats ? selectedFood.fats * multiplier : null,
      meal_name: selectedFood.brand 
        ? `${selectedFood.name} (${selectedFood.brand})` 
        : selectedFood.name,
    };
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('nutrition_logs')
      .insert(logData);
    
    if (error) {
      console.error('Error logging food:', error);
      toast.error("Errore nel salvataggio");
    } else {
      toast.success("Aggiunto al diario!");
      onOpenChange(false);
      onFoodLogged();
    }
    
    setIsSubmitting(false);
  };

  const selectFood = (food: UnifiedFood) => {
    setSelectedFood(food);
    setQuantity("100");
    setView('log');
  };

  const getScaledValue = (value: number | null) => {
    if (value === null) return "-";
    const qty = parseFloat(quantity) || 100;
    return ((value * qty) / 100).toFixed(1);
  };

  const hasSearchResults = searchQuery.trim() && (unifiedCustomFoods.length > 0 || unifiedApiResults.length > 0);
  const noResults = searchQuery.trim() && !isSearching && unifiedCustomFoods.length === 0 && unifiedApiResults.length === 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <div className="mx-auto w-full max-w-md flex flex-col overflow-hidden h-full">
          
          {/* SEARCH VIEW */}
          {view === 'search' && (
            <>
              <DrawerHeader className="text-center pb-2 shrink-0">
                <DrawerTitle className="text-lg">Cerca Cibo</DrawerTitle>
              </DrawerHeader>
              
              {/* Search Input */}
              <div className="px-4 pb-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                  <Input
                    placeholder="Cerca cibo (es. Riso, Petto di pollo...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/60 border-border h-12"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40 animate-spin" />
                  )}
                </div>
              </div>
              
              {/* Results */}
              <ScrollArea className="flex-1 px-4">
                {/* No search yet - show all custom foods */}
                {!searchQuery.trim() && (
                  <>
                    {customFoods.length > 0 && (
                      <div className="space-y-2 pb-4">
                        <div className="flex items-center gap-2 text-xs text-foreground/50 mb-2">
                          <User className="h-3.5 w-3.5" />
                          <span>I Tuoi Cibi</span>
                        </div>
                        {customFoods.map((food) => (
                          <FoodListItem
                            key={food.id}
                            food={{
                              id: food.id,
                              name: food.name,
                              brand: null,
                              calories: food.energy_kcal,
                              protein: food.protein,
                              carbs: food.carbs,
                              fats: food.fat,
                              fiber: food.fiber,
                              salt: food.salt,
                              source: 'custom',
                            }}
                            onSelect={selectFood}
                            onDelete={() => handleDeleteFood(food.id)}
                            showDelete
                          />
                        ))}
                      </div>
                    )}
                    {customFoods.length === 0 && (
                      <div className="text-center py-8 text-foreground/40 text-sm">
                        <p>Nessun cibo salvato</p>
                        <p className="mt-1">Cerca un cibo o creane uno nuovo</p>
                      </div>
                    )}
                  </>
                )}
                
                {/* Search results */}
                {searchQuery.trim() && (
                  <div className="space-y-4 pb-4">
                    {/* Custom Foods Results */}
                    {unifiedCustomFoods.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-foreground/50">
                          <User className="h-3.5 w-3.5" />
                          <span>I Tuoi Cibi</span>
                        </div>
                        {unifiedCustomFoods.map((food) => (
                          <FoodListItem
                            key={food.id}
                            food={food}
                            onSelect={selectFood}
                            onDelete={() => handleDeleteFood(food.id)}
                            showDelete
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* API Results */}
                    {unifiedApiResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-foreground/50">
                          <Globe className="h-3.5 w-3.5" />
                          <span>Database Globale</span>
                        </div>
                        {unifiedApiResults.map((food) => (
                          <FoodListItem
                            key={food.id}
                            food={food}
                            onSelect={selectFood}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Loading state */}
                    {isSearching && unifiedApiResults.length === 0 && (
                      <div className="text-center py-4 text-foreground/40 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        <p>Cercando...</p>
                      </div>
                    )}
                    
                    {/* No results */}
                    {noResults && (
                      <div className="text-center py-8 text-foreground/40 text-sm">
                        <p>Nessun risultato per "{searchQuery}"</p>
                        <Button
                          variant="link"
                          onClick={() => {
                            setFormData({ ...initialFormState, name: searchQuery });
                            setView('create');
                          }}
                          className="mt-2 text-indigo-400 hover:text-indigo-300"
                        >
                          Crea "{searchQuery}" come cibo personalizzato
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              <DrawerFooter className="pt-2 shrink-0 border-t border-slate-700/50">
                <Button
                  onClick={() => {
                    setFormData(initialFormState);
                    setView('create');
                  }}
                  className="w-full h-12 font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crea Nuovo Cibo
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-900/20 text-sm">
                    Annulla
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
          
          {/* CREATE VIEW */}
          {view === 'create' && (
            <>
              <DrawerHeader className="pb-2 shrink-0">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setView('search')}
                    className="mr-2 -ml-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <DrawerTitle className="text-lg">Nuovo Cibo</DrawerTitle>
                </div>
                <p className="text-xs text-foreground/50 mt-1 ml-10">Valori per 100g</p>
              </DrawerHeader>
              
              <div className="flex-1 overflow-y-auto px-4">
                <div className="space-y-4 pb-8">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/60">Nome del cibo *</Label>
                    <Input
                      placeholder="es. Petto di pollo"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      className="bg-slate-800/60 border-slate-700 h-12"
                    />
                  </div>
                  
                  {/* Energy */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/60">Energia (kcal)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder={calculatedKcal > 0 ? `${calculatedKcal} (auto)` : "0"}
                      value={formData.energy_kcal}
                      onChange={(e) => handleFieldChange("energy_kcal", e.target.value)}
                      className="bg-slate-800/60 border-slate-700 h-11"
                    />
                    {calculatedKcal > 0 && !formData.energy_kcal && (
                      <p className="text-xs text-foreground/40">
                        Calcolate dai macro: {calculatedKcal} kcal
                      </p>
                    )}
                  </div>
                  
                  {/* Macros */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-foreground/70">Macronutrienti</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Grassi (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.fat}
                          onChange={(e) => handleFieldChange("fat", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">di cui saturi (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.saturated_fat}
                          onChange={(e) => handleFieldChange("saturated_fat", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Carboidrati (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.carbs}
                          onChange={(e) => handleFieldChange("carbs", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">di cui zuccheri (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.sugars}
                          onChange={(e) => handleFieldChange("sugars", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Proteine (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.protein}
                          onChange={(e) => handleFieldChange("protein", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Sale (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.salt}
                          onChange={(e) => handleFieldChange("salt", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs text-foreground/60">Fibre (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.fiber}
                          onChange={(e) => handleFieldChange("fiber", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Vitamins */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-foreground/70">Vitamine</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Vitamina A (µg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.vitamin_a}
                          onChange={(e) => handleFieldChange("vitamin_a", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Vitamina D (µg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.vitamin_d}
                          onChange={(e) => handleFieldChange("vitamin_d", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Vitamina E (mg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.vitamin_e}
                          onChange={(e) => handleFieldChange("vitamin_e", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Vitamina K (µg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.vitamin_k}
                          onChange={(e) => handleFieldChange("vitamin_k", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Vitamina C (mg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.vitamin_c}
                          onChange={(e) => handleFieldChange("vitamin_c", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Tiamina B1 (mg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.thiamine_b1}
                          onChange={(e) => handleFieldChange("thiamine_b1", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Riboflavina B2 (mg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.riboflavin_b2}
                          onChange={(e) => handleFieldChange("riboflavin_b2", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Niacina B3 (mg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.niacin_b3}
                          onChange={(e) => handleFieldChange("niacin_b3", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Vitamina B6 (mg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.vitamin_b6}
                          onChange={(e) => handleFieldChange("vitamin_b6", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Acido Folico B9 (µg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.folic_acid_b9}
                          onChange={(e) => handleFieldChange("folic_acid_b9", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Vitamina B12 (µg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.vitamin_b12}
                          onChange={(e) => handleFieldChange("vitamin_b12", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Biotina B7 (µg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.biotin_b7}
                          onChange={(e) => handleFieldChange("biotin_b7", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground/60">Acido Pantotenico B5 (mg)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.pantothenic_acid_b5}
                          onChange={(e) => handleFieldChange("pantothenic_acid_b5", e.target.value)}
                          className="bg-slate-800/60 border-slate-700 h-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DrawerFooter className="pt-2 shrink-0 border-t border-slate-700/50">
                <Button
                  onClick={() => handleCreateFood(true)}
                  className="w-full h-12 font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                  disabled={isSubmitting || !formData.name.trim()}
                >
                  {isSubmitting ? "Salvataggio..." : "Salva e Aggiungi al Diario"}
                </Button>
                <Button
                  onClick={() => handleCreateFood(false)}
                  variant="outline"
                  className="w-full h-10 border-slate-700 text-foreground/70"
                  disabled={isSubmitting || !formData.name.trim()}
                >
                  Solo Salva
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setView('search')}
                  className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-900/20 text-sm"
                >
                  Annulla
                </Button>
              </DrawerFooter>
            </>
          )}
          
          {/* LOG VIEW - Select quantity */}
          {view === 'log' && selectedFood && (
            <>
              <DrawerHeader className="pb-2 shrink-0">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setView('search')}
                    className="mr-2 -ml-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <DrawerTitle className="text-lg truncate">{selectedFood.name}</DrawerTitle>
                    {selectedFood.brand && (
                      <p className="text-xs text-foreground/50 truncate">{selectedFood.brand}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-10 mt-1">
                  {selectedFood.source === 'custom' ? (
                    <User className="h-3 w-3 text-indigo-400" />
                  ) : (
                    <Globe className="h-3 w-3 text-emerald-400" />
                  )}
                  <span className="text-xs text-foreground/50">
                    {selectedFood.source === 'custom' ? 'Cibo personalizzato' : 'Database globale'}
                  </span>
                </div>
              </DrawerHeader>
              
              <div className="flex-1 px-4 space-y-4">
                {/* Quantity Input */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/60">Quantità (g)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-slate-800/60 border-slate-700 h-14 text-xl font-bold text-center"
                  />
                </div>
                
                {/* Scaled Nutrition Preview */}
                <div className="bg-slate-800/40 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-foreground/70 mb-2">
                    Valori per {quantity || 100}g
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Energia</span>
                      <span className="font-medium">{getScaledValue(selectedFood.calories)} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Proteine</span>
                      <span className="font-medium">{getScaledValue(selectedFood.protein)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Carboidrati</span>
                      <span className="font-medium">{getScaledValue(selectedFood.carbs)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Grassi</span>
                      <span className="font-medium">{getScaledValue(selectedFood.fats)}g</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <DrawerFooter className="pt-2 shrink-0 border-t border-slate-700/50">
                <Button
                  onClick={handleLogFood}
                  className="w-full h-12 font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Aggiungendo..." : "Aggiungi al Diario"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setView('search')}
                  className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-900/20 text-sm"
                >
                  Annulla
                </Button>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Food List Item Component
interface FoodListItemProps {
  food: UnifiedFood;
  onSelect: (food: UnifiedFood) => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

function FoodListItem({ food, onSelect, onDelete, showDelete }: FoodListItemProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onSelect(food)}
        className="flex-1 text-left p-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{food.name}</p>
            {food.brand && (
              <p className="text-xs text-foreground/40 truncate">{food.brand}</p>
            )}
          </div>
          <span className="text-xs text-foreground/50 whitespace-nowrap">
            {food.calories || 0} kcal
          </span>
        </div>
        <p className="text-xs text-foreground/50 mt-1">
          P: {food.protein?.toFixed(1) || 0}g · C: {food.carbs?.toFixed(1) || 0}g · G: {food.fats?.toFixed(1) || 0}g
        </p>
      </button>
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="shrink-0 h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
