-- Add strategy mode and cycling targets columns to nutrition_plans
ALTER TABLE public.nutrition_plans 
ADD COLUMN IF NOT EXISTS strategy_mode text NOT NULL DEFAULT 'static';

ALTER TABLE public.nutrition_plans 
ADD COLUMN IF NOT EXISTS cycling_targets jsonb DEFAULT NULL;

-- Add constraint to validate strategy_mode values
ALTER TABLE public.nutrition_plans 
ADD CONSTRAINT valid_strategy_mode CHECK (strategy_mode IN ('static', 'cycling_on_off', 'custom_daily'));

-- Add comment for documentation
COMMENT ON COLUMN public.nutrition_plans.strategy_mode IS 'Nutrition strategy mode: static (same every day), cycling_on_off (training vs rest days), or custom_daily (per-day targets)';
COMMENT ON COLUMN public.nutrition_plans.cycling_targets IS 'JSON object containing targets for different scenarios. Example: {"on": {"calories": 2800, "protein": 200, "carbs": 300, "fats": 80}, "off": {"calories": 2200, "protein": 180, "carbs": 200, "fats": 70}}';