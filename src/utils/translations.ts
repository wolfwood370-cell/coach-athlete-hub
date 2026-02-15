// ── Italian UI Translation Maps ─────────────────────────
// Maps DB enum values to professional Italian labels.
// Variable/function names stay in English; only visible text is translated.

// Cycle Phases
export const CYCLE_PHASE_LABELS: Record<string, string> = {
  menstrual: "Fase Mestruale",
  follicular: "Fase Follicolare",
  ovulatory: "Fase Ovulatoria",
  luteal: "Fase Luteale",
  luteal_early: "Fase Luteale Iniziale",
  luteal_late: "Fase Luteale Tardiva",
};

// Muscle Groups (DB key → Italian label)
export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: "Pettorali",
  back: "Dorso",
  shoulders: "Spalle",
  arms: "Braccia",
  legs: "Gambe",
  core: "Core",
  glutes: "Glutei",
  calves: "Polpacci",
  forearms: "Avambracci",
};

// Training Intensities
export const INTENSITY_LABELS: Record<string, string> = {
  rpe: "Scala RPE",
  rir: "Ripetizioni in Riserva",
  deload: "Scarico",
  push_hard: "Massima Intensità",
  peak_performance: "Picco Prestazione",
  maintenance: "Mantenimento",
};

// Volume Suggestions
export const VOLUME_SUGGESTION_LABELS: Record<string, string> = {
  Deload: "Scarico",
  "Push Hard": "Massima Intensità",
  "Peak Performance": "Picco Prestazione",
  Maintenance: "Mantenimento",
};

// Injury Risk
export const INJURY_RISK_LABELS: Record<string, string> = {
  Low: "Basso",
  Moderate: "Moderato",
  "High — Protect Knees": "Alto — Protezione Articolare",
};

// Nutrition Focus
export const NUTRITION_FOCUS_LABELS: Record<string, string> = {
  "Iron & Hydration": "Ferro & Idratazione",
  "Carbs for intensity": "Carboidrati per l'intensità",
  "Protein & Antioxidants": "Proteine & Antiossidanti",
  "Hydration & Magnesium": "Idratazione & Magnesio",
};

// Alert Types
export const ALERT_TYPE_LABELS: Record<string, string> = {
  missed_workout: "Sessione Saltata",
  low_readiness: "Prontezza Bassa",
  active_injury: "Infortunio Attivo",
  high_acwr: "ACWR Elevato",
  rpe_spike: "Picco RPE",
  no_checkin: "Nessun Check-in",
  injury_risk: "Rischio Infortunio",
  high_strain: "Strain Elevato",
};

// Subscription Status
export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Attivo",
  trial: "Prova",
  past_due: "Scaduto",
  canceled: "Cancellato",
  none: "Nessuno",
};

// Billing Period
export const BILLING_PERIOD_LABELS: Record<string, string> = {
  monthly: "Mensile",
  yearly: "Annuale",
  "one-time": "Una Tantum",
};

// Content Types
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  link: "Link",
  text: "Testo",
};

// Workout Status
export const WORKOUT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Programmato",
  completed: "Completato",
  missed: "Saltato",
  pending: "In Attesa",
  in_progress: "In Corso",
};

// Readiness Levels
export const READINESS_LABELS: Record<string, string> = {
  high: "Ottimo",
  moderate: "Moderato",
  low: "Basso",
};

// Sync Status
export const SYNC_STATUS_LABELS: Record<string, string> = {
  synced: "Sincronizzato",
  syncing: "Sincronizzazione",
  offline: "Non in Linea",
};

// FMS Status
export const FMS_STATUS_LABELS: Record<string, string> = {
  optimal: "Ottimale",
  limited: "Limitato",
  dysfunctional: "Disfunzionale",
  pain: "Dolore",
};

// Generic helper to get a translated label with fallback
export function t(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}
