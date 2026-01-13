// Onboarding Data Types

export interface LegalConsent {
  medicalDisclaimer: boolean;
  professionalScope: boolean;
  dataAnalysis: boolean;
}

export interface BiometricsData {
  gender: 'male' | 'female' | 'other' | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  wearables: string[];
}

export interface LifestyleData {
  dailySteps: '<5k' | '5-8k' | '8-12k' | '>12k' | null;
  sleepHours: '<5h' | '5-6h' | '6-7h' | '7-8h' | '>8h' | null;
  recentDiet: boolean | null;
  weightTrend: 'stable' | 'down' | 'up' | null;
}

export interface TrainingData {
  preferredRpe: number;
  painAreas: string[];
  heartCondition: boolean | null;
  chestPain: boolean | null;
}

export interface NeurotypAnswer {
  questionIndex: number;
  value: 'very_true' | 'mostly_true' | 'somewhat_true' | 'not_very_true' | 'not_at_all';
}

export interface OnboardingData {
  legal: LegalConsent;
  biometrics: BiometricsData;
  lifestyle: LifestyleData;
  training: TrainingData;
  neurotypAnswers: NeurotypAnswer[];
}

export const defaultOnboardingData: OnboardingData = {
  legal: {
    medicalDisclaimer: false,
    professionalScope: false,
    dataAnalysis: false,
  },
  biometrics: {
    gender: null,
    dateOfBirth: null,
    heightCm: null,
    weightKg: null,
    wearables: [],
  },
  lifestyle: {
    dailySteps: null,
    sleepHours: null,
    recentDiet: null,
    weightTrend: null,
  },
  training: {
    preferredRpe: 7,
    painAreas: [],
    heartCondition: null,
    chestPain: null,
  },
  neurotypAnswers: [],
};

// Neurotype Questions
export interface NeurotypQuestion {
  id: number;
  text: string;
  type: '1A' | '1B' | '2A' | '2B' | '3';
  weight: 'A' | 'B';
}

export const neurotypQuestions: NeurotypQuestion[] = [
  // Type 1A (Intensity)
  { id: 1, text: "Quando sono in gruppo voglio esserne il leader.", type: '1A', weight: 'A' },
  { id: 2, text: "Se il servizio al ristorante è cattivo, lo faccio notare apertamente.", type: '1A', weight: 'A' },
  { id: 3, text: "Se qualcuno parla alle mie spalle, sento il bisogno di affrontarlo.", type: '1A', weight: 'A' },
  { id: 4, text: "Sento il bisogno di essere il migliore in ogni cosa (competitivo).", type: '1A', weight: 'B' },
  { id: 5, text: "Colgo sempre le opportunità rischiose pur di non avere rimpianti.", type: '1A', weight: 'B' },
  { id: 6, text: "Gli ostacoli mi motivano a lavorare più duramente.", type: '1A', weight: 'B' },
  
  // Type 1B (Explosive)
  { id: 7, text: "Ho riflessi molto veloci.", type: '1B', weight: 'A' },
  { id: 8, text: "So fare multitasking facilmente (es. lavoro con musica).", type: '1B', weight: 'A' },
  { id: 9, text: "Sono molto impaziente.", type: '1B', weight: 'A' },
  { id: 10, text: "Imparo facendo, non leggendo le istruzioni.", type: '1B', weight: 'B' },
  { id: 11, text: "Sono naturalmente esplosivo negli sport (scatti, salti).", type: '1B', weight: 'B' },
  { id: 12, text: "So leggere le persone e adattare il mio comportamento.", type: '1B', weight: 'B' },
  
  // Type 2A (Variety)
  { id: 13, text: "La mia autostima cala se gli altri non mi fanno complimenti.", type: '2A', weight: 'A' },
  { id: 14, text: "Provo piacere nel fare cose per gli altri (People Pleaser).", type: '2A', weight: 'A' },
  { id: 15, text: "Sono molto empatico e assorbo l'umore degli altri.", type: '2A', weight: 'A' },
  { id: 16, text: "La mia personalità cambia in base a con chi sono.", type: '2A', weight: 'B' },
  { id: 17, text: "Procrastino spesso ma lavoro bene sotto pressione all'ultimo.", type: '2A', weight: 'B' },
  { id: 18, text: "Voglio andare d'accordo con tutti ed evito i conflitti.", type: '2A', weight: 'B' },
  
  // Type 2B (Sensory)
  { id: 19, text: "Sono molto emotivo; le mie sensazioni sono intense.", type: '2B', weight: 'A' },
  { id: 20, text: "Preferisco attività familiari piuttosto che provare cose nuove.", type: '2B', weight: 'A' },
  { id: 21, text: "Ho un 'comfort food' che mangerei ogni giorno.", type: '2B', weight: 'A' },
  { id: 22, text: "Ho bisogno di sentirmi amato per stare bene con me stesso.", type: '2B', weight: 'B' },
  { id: 23, text: "Ho spesso dialoghi interni negativi ('non ce la faccio').", type: '2B', weight: 'B' },
  { id: 24, text: "Mi importa molto cosa pensano gli altri di me.", type: '2B', weight: 'B' },
  
  // Type 3 (Routine)
  { id: 25, text: "Prendo decisioni basate sui fatti, non sulle emozioni.", type: '3', weight: 'A' },
  { id: 26, text: "Non amo attività ad alto rischio.", type: '3', weight: 'A' },
  { id: 27, text: "Mi preoccupo molto di cosa potrebbe andare storto in futuro.", type: '3', weight: 'A' },
  { id: 28, text: "Preferisco passare il tempo libero da solo (hobby tranquilli).", type: '3', weight: 'B' },
  { id: 29, text: "Amo la routine e seguire programmi rigidi.", type: '3', weight: 'B' },
  { id: 30, text: "Sono perfezionista e odio fare errori.", type: '3', weight: 'B' },
];

// Scoring values
export const answerScores: Record<NeurotypAnswer['value'], { A: number; B: number }> = {
  'very_true': { A: 15, B: 5 },
  'mostly_true': { A: 12, B: 4 },
  'somewhat_true': { A: 2, B: 2 },
  'not_very_true': { A: 0, B: 0 },
  'not_at_all': { A: -3, B: -1 },
};

export type NeurotypType = '1A' | '1B' | '2A' | '2B' | '3';

export const neurotypLabels: Record<NeurotypType, { name: string; description: string }> = {
  '1A': { 
    name: 'Type 1A - Intensity', 
    description: 'Dominante, competitivo, guidato dalla dopamina. Risponde bene a carichi pesanti e sfide intense.' 
  },
  '1B': { 
    name: 'Type 1B - Explosive', 
    description: 'Veloce, reattivo, adattabile. Eccelle in esplosività e varietà di stimoli.' 
  },
  '2A': { 
    name: 'Type 2A - Variety', 
    description: 'Empatico, versatile, sensibile al feedback. Necessita varietà e riconoscimento.' 
  },
  '2B': { 
    name: 'Type 2B - Sensory', 
    description: 'Emotivo, sensoriale, legato alle abitudini. Preferisce routine confortevoli e progressione graduale.' 
  },
  '3': { 
    name: 'Type 3 - Routine', 
    description: 'Analitico, metodico, avverso al rischio. Ottimale con programmi strutturati e progressioni lineari.' 
  },
};
