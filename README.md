# Lumina — Aura Health System

Progetto React + TypeScript + Tailwind per l'app **Lumina**, companion per atleti d'élite. Pensato per essere importato in **Lovable** (template Vite + React + TS) come continuazione di un refactoring già in corso.

---

## 1. Cosa contiene questo bundle

```
lumina/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts          ← design tokens Aura completi
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts              ← alias @/ → src/
└── src/
    ├── App.tsx                 ← BrowserRouter + 5 routes
    ├── main.tsx
    ├── index.css               ← font + Material Symbols + base
    ├── components/
    │   ├── copilot/            ← 7 componenti AI (NUOVI)
    │   │   ├── ChatInput.tsx
    │   │   ├── CopilotMessage.tsx
    │   │   ├── ProactiveCard.tsx
    │   │   ├── ProposedAdjustments.tsx
    │   │   ├── RiskAlertCard.tsx
    │   │   ├── SuggestedPrompts.tsx
    │   │   ├── UserMessage.tsx
    │   │   └── index.ts
    │   └── notifications/      ← 2 componenti (NUOVI)
    │       ├── NotificationGroup.tsx
    │       ├── NotificationItem.tsx
    │       └── index.ts
    └── pages/
        ├── Copilot.tsx
        ├── Dashboard.tsx
        ├── Notifications.tsx
        ├── Nutrition.tsx
        └── Training.tsx
```

---

## 2. Design system

I token di stile sono espressi in `tailwind.config.ts` e seguono **Aura Health System** (vedi i mockup `DESIGN.md`).

### Palette
- **Primary** (Deep Cerulean `#005685` / Container `#226fa3`) → tipografia high-priority, CTA, iconografia primaria.
- **Secondary** (`#3b6284`) → testo strutturale, etichette di supporto.
- **Surface tiers** (`surface-container-lowest` … `surface-container-highest`) → background a stratificazione "frosted".
- **Violet** (`violet-50` … `violet-600`) → **riservato esclusivamente al Copilot AI**. Usato per avatar, send button, proactive card, chip "COPILOT SUGGESTION". Non usarlo altrove.
- **Error** (`#ba1a1a` / `error-container`) → risk alert, fastidi, intervention warnings.

### Tipografia
- **Manrope** → headlines (`headline-lg`), display (`display-xl`), dati biometrici (`stat-lg`).
- **Inter** → body (`body-md`), label uppercase (`label-sm`).

### Forme
- `rounded` (1rem) → widget standard.
- `rounded-md` (1.5rem) / `rounded-lg` (2rem) → card biometriche.
- `rounded-full` → buttons, chips, status indicators.

### Elevation
- Niente drop shadow pesanti. Si usa `shadow-ambient` (definito in tailwind.config) e backdrop-blur.
- Helper class: `.glass-widget` (Level 1) e `.glass-overlay` (Level 2) in `index.css`.

---

## 3. Dipendenze tra i moduli

Le pages importano da queste cartelle. **Le 5 pages assumono che esistano i seguenti simboli** — se i nomi nel tuo `components/` divergono, vanno allineati.

### `@/components/layout`
```ts
export function Header(props: {
  title: string;
  showAvatar?: boolean;
  showNotificationsBell?: boolean;
  leadingIcon?: string;       // Material Symbols name
  trailingIcon?: string;      // Material Symbols name
}): JSX.Element

export function BottomNav(props: {
  active: "dashboard" | "training" | "nutrition" | "copilot";
}): JSX.Element
```

> La `BottomNav` è in stile **light uniforme** su tutte le pages: `bg-white/80` + `backdrop-blur-3xl` + `rounded-t-[32px]` + `shadow-nav-up`. Le 4 voci sono Dashboard / Training / Nutrition / Copilot. Quella attiva ha pillola `surface-container-low` se è una tab "blu", oppure pillola `bg-violet-500` se è Copilot.

### `@/components/ui`
```ts
export function SegmentedControl(props: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}): JSX.Element

export function FAB(props: {
  icon: string;          // Material Symbols name
  ariaLabel: string;
  onClick?: () => void;
}): JSX.Element
```

### `@/components/dashboard`
```ts
export function ReadinessWidget(props: { readiness: ReadinessData }): JSX.Element
export function TodaysFocusWidget(props: { workout: WorkoutSummary }): JSX.Element
export function NutritionSummaryWidget(props: { nutrition: NutritionSnapshot }): JSX.Element
```

### `@/components/training`
```ts
export function WeekStrip(props: { days: TrainingDay[] }): JSX.Element
export function MainWorkoutCard(props: { workout: WorkoutSummary }): JSX.Element
export function TrainingStatCard(props: { stat: TrainingStat }): JSX.Element
export function WorkoutPhaseRow(props: { phase: WorkoutPhase }): JSX.Element
export function StartWorkoutButton(props: { label: string; onClick?: () => void }): JSX.Element
```

### `@/components/nutrition`
```ts
export function MacroSummaryCard(props: { nutrition: NutritionSnapshot }): JSX.Element
export function NutritionStatCard(props: { stat: NutritionStat }): JSX.Element
export function MealTimeline(props: { meals: Meal[] }): JSX.Element
```

### `@/lib/utils`
```ts
export function cn(...classes: Array<string | undefined | false | null>): string
```
> È il classico helper `clsx`-style. I componenti `copilot/` e `notifications/` lo usano per comporre className condizionali.

### `@/data` — mock di sviluppo
Importati dalle pages. Servono questi export:

| Export                  | Usato da             | Tipo (orientativo)                          |
| ----------------------- | -------------------- | ------------------------------------------- |
| `mockUser`              | `Header`             | `User`                                      |
| `mockReadiness`         | `Dashboard`          | `ReadinessData`                             |
| `mockTodayWorkout`      | `Dashboard, Training`| `WorkoutSummary`                            |
| `mockNutritionToday`    | `Dashboard, Nutrition` | `NutritionSnapshot`                       |
| `mockTrainingWeek`      | `Training`           | `TrainingDay[]`                             |
| `mockTrainingStats`     | `Training`           | `{ weeklyLoad: TrainingStat; readiness: TrainingStat }` |
| `mockWorkoutPhases`     | `Training`           | `WorkoutPhase[]`                            |
| `mockNutritionStats`    | `Nutrition`          | `{ expenditure: NutritionStat; weightTrend: NutritionStat }` |
| `mockMealTimeline`      | `Nutrition`          | `Meal[]`                                    |
| `mockCopilotState`      | `Copilot`            | `{ proactive, suggestedPrompts, messages }` (vedi sotto) |
| `mockNotifications`     | `Notifications`      | `{ today: NotificationData[]; earlier: NotificationData[] }` |

#### Forma esatta di `mockCopilotState`
```ts
export const mockCopilotState = {
  proactive: {
    label: "ANALISI MATTUTINA",
    icon: "insights",        // Material Symbols name
    body: "Buongiorno. Il tuo recupero (85%) è eccellente, ma l'ACWR è alto (1.2). Ti consiglio di mantenere invariato il volume oggi, senza forzare i massimali.",
  },
  suggestedPrompts: [
    "Cosa mangio post-workout?",
    "Adatta l'allenamento",
    "Analizza il mio sonno",
  ],
  messages: [
    { id: "1", role: "user",    content: "Ho un po' di fastidio al ginocchio destro dopo gli squat di ieri." },
    { id: "2", role: "copilot", content: "Ho registrato il feedback. Sostituiamo il Back Squat di oggi con una Leg Press o un Bulgarian Split Squat per ridurre il carico articolare. Quale preferisci?" },
  ],
};
```

#### Forma esatta di `mockNotifications`
Ogni elemento è un `NotificationData` (vedi `@/components/notifications`):
```ts
export const mockNotifications = {
  today: [
    {
      id: "n1",
      category: "coach",       // "coach" | "checkin" | "training" | "nutrition" | "copilot" | "billing" | "achievement"
      title: "New message from Coach",
      body: "Great job on the squats yesterday. Make sure to focus on your depth for the next set.",
      timeAgo: "10m ago",
      isUnread: true,
      avatarUrl: "https://...",  // opzionale; sostituisce l'icona di categoria
    },
    { id: "n2", category: "checkin", title: "Weekly Check-in Due", body: "Please complete your end-of-week biometric and subjective feeling survey before midnight.", timeAgo: "2h ago", isUnread: true },
  ],
  earlier: [
    { id: "n3", category: "training", title: "Phase 2 Unlocked", body: "Hypertrophy block is now available.", timeAgo: "Yesterday", isUnread: false },
    { id: "n4", category: "billing",  title: "Payment successful", body: "Invoice #8892 paid via ending in 4242.", timeAgo: "Oct 12", isUnread: false },
  ],
};
```

---

## 4. Routing

`App.tsx` definisce un BrowserRouter flat:

| Path             | Component       |
| ---------------- | --------------- |
| `/`              | redirect → `/dashboard` |
| `/dashboard`     | `Dashboard`     |
| `/training`      | `Training`      |
| `/nutrition`     | `Nutrition`     |
| `/copilot`       | `Copilot`       |
| `/notifications` | `Notifications` |
| `*`              | redirect → `/dashboard` |

La `BottomNav` deve usare `react-router-dom` `<NavLink>` (o `useNavigate`) per cambiare tab. La page `Notifications` è raggiungibile dalla campanella nell'`Header` del Dashboard ed effettua `navigate(-1)` sul back arrow.

---

## 5. Import in Lovable: passi consigliati

1. **Avvia un nuovo progetto Lovable** (template "React + Vite + Tailwind").
2. **Sostituisci** i file di config: `tailwind.config.ts`, `postcss.config.js`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `package.json`.
3. **Sostituisci** `src/index.css`, `src/main.tsx`, `src/App.tsx`.
4. **Copia** `src/components/copilot/` e `src/components/notifications/` nelle posizioni corrispondenti.
5. **Copia** le 5 pages in `src/pages/`.
6. **Verifica** che esistano già (dal refactoring precedente):
   - `src/components/{shared,ui,layout,dashboard,training,nutrition}/`
   - `src/data/index.ts` con i mock elencati al §3
   - `src/lib/utils.ts` con `cn()`
   - `src/types/` con le interfacce dei dati
7. **Allinea** eventuali nomi divergenti tra i simboli importati e quelli realmente esposti dalle altre cartelle. Se serve, aggiusta i `props` nelle pages.
8. `npm install && npm run dev` → l'app dovrebbe partire pulita su `http://localhost:5173/`.

---

## 6. Convenzioni di stile applicate

- **Mobile-first**. Tutti i layout assumono ~390px di viewport. Centratura tramite `max-w-lg mx-auto` (o `max-w-2xl` per Copilot).
- **Padding bottom generoso** (`pb-32`/`pb-40`) per evitare che il contenuto finisca sotto la BottomNav fissa.
- **Padding top** `pt-[88px]` o `pt-24` per evitare cut-off sotto l'Header fisso.
- **Material Symbols** via `<span class="material-symbols-outlined">{icon_name}</span>`. Già configurato in `index.css`.
- **`cn()` helper** per className condizionali — assunto presente in `@/lib/utils`.
- **Niente classi dinamiche** come `bg-${color}-500` (Tailwind non le riesce a estrarre): tutti i nomi colore sono letterali nelle stringhe.

---

## 7. Note di prosecuzione

**Cosa è statico in questa pass:**
- I tab `Diario`/`Metriche` e `Diario`/`Strategia` cambiano stato locale ma non condizionano il rendering. La vista alternativa è da implementare.
- La chat Copilot mostra solo i messaggi mock — niente invio, niente streaming.
- I prompt suggeriti hanno `onSelect` opzionale ma non collegato.
- Il "Mark all read" e il dot di "non letto" sono presentazionali.

**Estensioni naturali successive:**
- Stato globale (Zustand o context) per la chat Copilot.
- React Query per i dati biometrici quando arriva il backend.
- Animazioni di transizione tra tab (Framer Motion).
- Vista `Metriche` del Training (chart ACWR + carico settimanale — vedi mockup `acwr_analysis_details`).
- Vista `Strategia` della Nutrition (vedi mockup `nutrition_strategy_overview`).
- Flow di intervention completo: usare `RiskAlertCard` + `ProposedAdjustments` su una page dedicata `/copilot/intervention`.
