-- Step 1: Cleanup duplicate active plans - keep only the latest per athlete
WITH ranked_plans AS (
  SELECT id,
         athlete_id,
         ROW_NUMBER() OVER (PARTITION BY athlete_id ORDER BY created_at DESC) as rn
  FROM nutrition_plans
  WHERE active = true
)
UPDATE nutrition_plans
SET active = false
WHERE id IN (
  SELECT id FROM ranked_plans WHERE rn > 1
);

-- Step 2: Add partial unique index to prevent duplicate active plans
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_plan_per_athlete 
ON nutrition_plans (athlete_id) 
WHERE (active = true);

-- Step 3: Add check constraint for strategy_mode (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_strategy_mode'
  ) THEN
    ALTER TABLE nutrition_plans 
    ADD CONSTRAINT valid_strategy_mode 
    CHECK (strategy_mode IN ('static', 'cycling_on_off'));
  END IF;
END $$;