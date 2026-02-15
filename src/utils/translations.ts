// ============================================
// CENTRALIZED ITALIAN LOCALIZATION UTILITY
// Maps database ENUMs and UI labels to Italian
// ============================================

// Cycle Phases
export const CYCLE_PHASE_LABELS: Record<string, string> = {
  menstrual: "Mestruale",
  follicular: "Follicolare",
  ovulatory: "Ovulatoria",
  luteal: "Luteale",
  luteal_early: "Luteale Precoce",
  luteal_late: "Luteale Tardiva",
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
  traps: "Trapezi",
};

// Intensity / Effort Labels
export const INTENSITY_LABELS: Record<string, string> = {
  RPE: "Scala RPE",
  RIR: "Ripetizioni in Riserva",
  "1RM": "Massimale Stimato",
  volume: "Volume",
  intensity: "Intensità",
  load: "Carico",
  tonnage: "Tonnellaggio",
};

// Alert Types (Coach Dashboard)
export const ALERT_TYPE_LABELS: Record<string, string> = {
  missed_workout: "Allenamento Saltato",
  low_readiness: "Readiness Bassa",
  active_injury: "Infortunio Attivo",
  high_acwr: "ACWR Elevato",
  rpe_spike: "RPE Elevato",
  no_checkin: "Nessun Check-in",
  injury_risk: "Rischio Infortunio",
  high_strain: "Strain Elevato",
};

// Alert Severity
export const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critico",
  warning: "Attenzione",
  info: "Informativo",
};

// Workout Status
export const WORKOUT_STATUS_LABELS: Record<string, string> = {
  pending: "In Attesa",
  scheduled: "Programmato",
  in_progress: "In Corso",
  completed: "Completato",
  missed: "Saltato",
  skipped: "Saltato",
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

// Content Types (Library)
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  link: "Link",
  text: "Testo",
};

// Contraceptive Types
export const CONTRACEPTIVE_LABELS: Record<string, string> = {
  none: "Nessuno",
  pill: "Pillola",
  iud_hormonal: "IUD Ormonale",
  iud_copper: "IUD Rame",
};

// Training Day Types
export const TRAINING_DAY_LABELS: Record<string, string> = {
  training: "Giornata di Allenamento",
  rest: "Giornata di Recupero",
};

// Readiness Levels
export const READINESS_LABELS: Record<string, string> = {
  high: "Ottimale",
  moderate: "Moderato",
  low: "Basso",
};

// Phase Focus Types (Periodization)
export const PHASE_FOCUS_LABELS: Record<string, string> = {
  hypertrophy: "Ipertrofia",
  strength: "Forza",
  power: "Potenza",
  endurance: "Resistenza",
  deload: "Scarico",
  peaking: "Picco",
};

// FMS Status Labels
export const FMS_STATUS_LABELS: Record<string, string> = {
  optimal: "Ottimale",
  limited: "Limitato",
  dysfunctional: "Disfunzionale",
  pain: "Dolore",
};

// Injury Status Labels
export const INJURY_STATUS_LABELS: Record<string, string> = {
  in_rehab: "In Riabilitazione",
  recovered: "Recuperato",
  chronic: "Cronico",
};

// Generic helper to translate a key using any map, falling back to the key itself
export function t(map: Record<string, string>, key: string): string {
  return map[key] || key;
}
