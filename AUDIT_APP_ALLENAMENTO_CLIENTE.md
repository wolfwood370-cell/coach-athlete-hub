# Audit App di Allenamento del Cliente

**Branch**: `claude/flamboyant-hertz-937c2d`
**Data**: 2026-05-18
**Commit di riferimento**: `1ecd63f` (post-onboarding-refactor, post-audit-refresh)

**Scope** — flusso completo di allenamento lato atleta:
- `src/pages/athlete/AthleteTraining.tsx` (entry / training hub)
- `src/pages/athlete/WorkoutPhaseDetail.tsx` (anteprima fase)
- `src/pages/athlete/ExercisePreview.tsx` (anteprima singolo esercizio)
- `src/pages/athlete/ActiveWorkout.tsx` (sessione attiva)
- `src/pages/athlete/PostWorkoutDebrief.tsx` (debrief post-sessione)
- `src/components/athlete/ExitWorkoutDialog.tsx`
- `src/components/athlete/drawers/*` (5 drawer + DrawerShell)
- `src/hooks/athlete/useAthleteWorkoutHooks.ts`
- `src/stores/useAthleteWorkoutStore.ts`

**Out of scope** (audit dedicati separati):
- Readiness / DailyCheckin → vedi `ATHLETE_APP_AUDIT.md`
- Onboarding flow → vedi `ATHLETE_APP_AUDIT.md` § H10/M11/M12/L11
- Analytics (TrainingAnalytics, AcwrAnalysis) → non auditato

**Metodologia**: lettura diretta dei sorgenti + tracing del flusso end-to-end (Training Hub → Phase Detail → Exercise Preview → Active Workout → Drawer → Debrief), verifica di ogni transizione di stato, controllo dei side-effect su Supabase, mock data inventory.

**Status complessivo**:
- ✅ Layout responsivo, accessibilità di base (aria-label, role, focus initiale ben gestito)
- ✅ Type-safety pulita: zero `any`/`as any`/`@ts-ignore`
- ✅ Type-check (`tsc --noEmit`): exit 0
- ⚠️ **Solo 1 dei 5 drawer di esecuzione persiste su DB**. Gli altri 4 sono UI mockup.
- ⚠️ **80% del contenuto della sessione è hardcoded**: nomi esercizi, schemi, target, recuperi. Il backend è cablato solo per i metadata della sessione (start/stop/sets), non per il contenuto.
- 🔴 **4 bug certi che generano dati orfani o inconsistenti su un DB reale**.

---

## 🔴 Criticità (Critical) — bloccano il go-live

### C1. Mock exercise IDs producono FK violation alla prima "Aggiungi Set"

- **Dove**: [`src/pages/athlete/ActiveWorkout.tsx:104-115`](src/pages/athlete/ActiveWorkout.tsx) — `ACTIVE_EXERCISE.id = "a1"`, `UPCOMING[].id = "b1"/"b2"`. Stesso pattern in [`AthleteTraining.tsx`](src/pages/athlete/AthleteTraining.tsx) (`id: "1"`, `"a1"`, `"b1"`, `"c1"`).
- **Cosa succede in produzione**:
  1. Atleta apre il workout → ActiveWorkout monta → `useStartSessionMutation` INSERT workout_logs OK.
  2. Atleta tap "Aggiungi Set" → `useLogSetMutation.mutate({ exercise_id: "a1", ... })`.
  3. Postgres rifiuta: `exercise_logs.exercise_id` è `UUID NOT NULL REFERENCES exercises(id)`. `"a1"` non è UUID.
  4. Toast "Salvataggio serie fallito" appare. Set non viene salvato.
  5. UI continua a mostrare 0/N completed sets perché `useSessionSetsQuery` non ha righe da rendere.
- **Impatto**: tutta la sessione persiste come "in corso" in DB ma senza un solo set tracciato. Il coach vede un atleta che ha avviato una sessione di 1 ora e mezza senza loggare nulla.
- **Fix**:
  1. Creare hook `useExercisesQuery()` che legge da `exercises` table.
  2. Sostituire array hardcoded con dati query (gli ID saranno UUID validi).
  3. Aggiungere skeleton mentre query è pending.
  4. Wiring del `workout_id` corretto in `useStartSessionMutation` per propagare il context del workout prescritto.

### C2. 4 drawer su 5 non persistono nulla — i dati spariscono al close

- **Dove**:
  - [`SupersetDrawer.tsx:62`](src/components/athlete/drawers/SupersetDrawer.tsx) — `useState<SupersetExercise[]>(INITIAL)`, nessuna mutation
  - [`AmrapDrawer.tsx`](src/components/athlete/drawers/AmrapDrawer.tsx) — countdown + rounds + extraReps in `useState`, nessuna mutation
  - [`IntensityDrawer.tsx:58-59`](src/components/athlete/drawers/IntensityDrawer.tsx) — `useState(INITIAL)`, nessuna mutation
  - [`IsometricDrawer.tsx`](src/components/athlete/drawers/IsometricDrawer.tsx) — timer + sets locali, nessuna mutation
  - Solo `StandardSetDrawer` chiama `useLogSetMutation`.
- **Impatto**: se la sessione include un Superset, un AMRAP, un Intensity protocol o un Isometric set, l'atleta li esegue, registra kg/reps/round nel drawer, lo chiude per andare al prossimo esercizio, e **tutti i dati sono persi**. Il debrief mostrerà 0 set e 0 kg di volume per quegli esercizi. Il coach vedrà un workout vuoto.
- **Fix**:
  1. Estendere lo schema `exercise_logs` con colonne opzionali per protocolli speciali: `duration_seconds`, `rounds`, `rest_seconds`, `set_type` (enum: standard/superset/amrap/emom/isometric/intensity).
  2. Replicare il pattern di `StandardSetDrawer` (`useLogSetMutation` + `useSessionSetsQuery`) negli altri 4 drawer.
  3. Per Superset: ogni "Aggiungi Set" su un esercizio del superset diventa 1 row di `exercise_logs` con `set_type='superset'` e un campo aggiuntivo `superset_group_id` per raggruppare gli esercizi correlati.

### C3. `handleDiscard` lascia orphan `workout_logs` row in DB

- **Dove**: [`src/pages/athlete/ActiveWorkout.tsx:630-637`](src/pages/athlete/ActiveWorkout.tsx) — il flow "Annulla Workout" chiama solo `stopSession()` (cancella state Zustand locale), poi `navigate("/athlete/training")`. **Nessun UPDATE su `workout_logs`**.
- **Impatto**: il row INSERTed da `useStartSessionMutation` resta in DB con `status='in_progress'`, senza `completed_at`. Il coach apre la dashboard atleta e vede una lista di sessioni "in corso" che non finiranno mai. Dopo 50 discard, le statistiche di adherence sono completamente sballate.
- **Fix**: creare `useDiscardSessionMutation` che fa `UPDATE workout_logs SET status='skipped', completed_at=now() WHERE id=session_id` prima del local `stopSession()`. Da chiamare in `handleDiscard`.

### C4. `handleFinish` non chiude la sessione → state orfano se l'utente esce dal debrief

- **Dove**: [`src/pages/athlete/ActiveWorkout.tsx:623-626`](src/pages/athlete/ActiveWorkout.tsx) — `handleFinish` chiude il dialog e naviga a `/athlete/post-workout`. **NON chiama `stopSession()`**. La cancellazione del local state è demandata al debrief.
- **Impatto**: se l'atleta sul debrief:
  - chiude la tab → `workout_logs` resta `in_progress`, Zustand conserva `activeSessionId`, `isSessionActive=true`, `elapsedTime` continua a crescere se il timer è ancora attivo (no: il setInterval è cleanato dall'unmount di ActiveWorkout).
  - naviga via senza salvare (es. tap su deep link) → idem
  - subisce un crash JS → idem
- **Impatto extra**: al prossimo accesso ad `/athlete/active-workout`, il mount effect (linea 588-602) chiama `stopSession()` e parte una nuova sessione → la VECCHIA `workout_logs` row resta indefinitamente in `in_progress` (vedi C3 per il bloat).
- **Fix**: in `handleFinish`, dopo `setIsExitOpen(false)`, prima di navigate, salvare l'`activeSessionId` in route state (`navigate('/athlete/post-workout', { state: { sessionId } })`) E avviare un setTimeout di 30 minuti come safety net: se il debrief non si conclude in tempo, mark `workout_logs` come `skipped`. Soluzione più semplice: trigger Postgres che marca come `skipped` qualsiasi `workout_logs` con `status='in_progress'` e `started_at < now() - interval '6 hours'`.

### C5. Mutation buttons non disabilitati durante `isPending` → doppio insert su rete lenta

- **Dove**:
  - [`src/pages/athlete/PostWorkoutDebrief.tsx`](src/pages/athlete/PostWorkoutDebrief.tsx) — bottone "Salva e Torna alla Home" non disabilita durante `finishSession.isPending`.
  - `StandardSetDrawer.tsx` lo fa già correttamente (riga 90-93). Replicare ovunque.
- **Impatto**: su 4G/2G l'utente tap "Salva", non vede feedback immediato, tap di nuovo → due UPDATE consecutivi su `workout_logs` (il secondo sovrascrive il primo con potenzialmente stessi dati, OK in teoria, ma il doppio toast crea confusione).
- **Fix**: `disabled={finishSession.isPending}` + spinner inline + cambio testo bottone a "Salvataggio…".

---

## 🟡 Medio (Medium) — degradano UX e affidabilità

### M1. Tutto il contenuto del workout è hardcoded — il workout reale del coach non si vede

- **Dove**:
  - [`ActiveWorkout.tsx:96-118`](src/pages/athlete/ActiveWorkout.tsx) — `COMPLETED_PHASE` (Movement Prep), `ACTIVE_EXERCISE` (A1 Barbell Back Squat), `UPCOMING` (B1 RDL, B2 Pull-ups), `SESSION_PROGRESS_PERCENT = 30`
  - [`PostWorkoutDebrief.tsx:45-49`](src/pages/athlete/PostWorkoutDebrief.tsx) — `WORKOUT_SUMMARY.title = "Lower Body Power"`, muscles = [...] hardcoded
  - [`StandardSetDrawer.tsx:163-166`](src/components/athlete/drawers/StandardSetDrawer.tsx) — coach notes "Eccentrica controllata di 3 secondi..." literal
  - [`AmrapDrawer.tsx:19`](src/components/athlete/drawers/AmrapDrawer.tsx) — `TOTAL_SECONDS_DEFAULT = 12 * 60` literal
  - [`IntensityDrawer.tsx:150-151`](src/components/athlete/drawers/IntensityDrawer.tsx) — title "C1. Machine Lateral Raise" literal nel JSX (non viene dal prop)
- **Impatto**: il `workout_logs.workout_id` punta al workout prescritto, ma la UI non lo legge. Indipendentemente da cosa prescrive il coach, l'atleta vede sempre Barbell Back Squat / RDL / Pull-ups. È una demo, non una app.
- **Fix**: useEffect alla mount per fetchare `workouts.id = workout_logs.workout_id` → propagare a tutti i drawer e card. Vedi anche C1 per gli exercise IDs.

### M2. `SessionStatsCard` propaga `NaN` se una riga è anomala

- **Dove**: [`src/pages/athlete/PostWorkoutDebrief.tsx:82-87`](src/pages/athlete/PostWorkoutDebrief.tsx)
  ```ts
  for (const row of rows) {
    totalVolumeKg += row.weight * row.reps;
  }
  ```
- **Impatto**: il type generato dice `weight: number, reps: number` (NOT NULL nel CHECK), ma se un INSERT manuale da Studio o un edge case violano l'invariante (es. cast da `unknown` lato server), `null * null = NaN` si propaga al display "NaN kg". Aspetto poco professionale.
- **Fix**: `const w = Number(row.weight) || 0; const r = Number(row.reps) || 0; totalVolumeKg += w * r;`

### M3. Mancanza di optimistic update su `useLogSetMutation`

- **Dove**: [`src/hooks/athlete/useAthleteWorkoutHooks.ts:152-184`](src/hooks/athlete/useAthleteWorkoutHooks.ts) — `useLogSetMutation` invalida la query in `onSuccess`, l'UI vede il nuovo set solo dopo il round-trip server.
- **Impatto**: tap "Aggiungi Set" → input si svuotano → ma la card "Serie Completate (N)" rimane a N (vecchio) per 100-500ms finché la query refetch finisce. L'atleta in flow può fraintendere ("non si è registrato?") e ri-tappare.
- **Suggerimento**: `useLogSetMutation` con `onMutate` che inietta la nuova riga nella cache (`queryClient.setQueryData(...)`) PRIMA del round-trip; in `onError` fa il rollback. Il drawer è già protetto da `isPending` per evitare doppi tap, quindi l'optimistic è safe.

### M4. `ExitWorkoutDialog` esplicitamente senza focus trap

- **Dove**: [`src/components/athlete/ExitWorkoutDialog.tsx:22-25`](src/components/athlete/ExitWorkoutDialog.tsx) — commento esplicito "Focus trap NOT implemented in this commit".
- **Impatto**: utenti keyboard / screen-reader possono Tab fuori dal dialog e tornare sul contenuto ActiveWorkout sottostante (z-50 ma non `inert`). Violazione WCAG 2.4.3 (Focus Order).
- **Suggerimento**: aggiungere `inert` sul background (`#root` o l'overlay ActiveWorkout) quando dialog è open, oppure utilizzare la primitiva shadcn `<AlertDialog>` (già presente in `src/components/ui/alert-dialog.tsx`) che ha focus trap built-in.

### M5. Timer `useEffect` nei drawer con `remaining` nelle dependencies

- **Dove**:
  - [`AmrapDrawer.tsx:63-77`](src/components/athlete/drawers/AmrapDrawer.tsx) — deps `[open, isPaused, remaining]`
  - [`IsometricDrawer.tsx:54-68`](src/components/athlete/drawers/IsometricDrawer.tsx) — deps `[runningSetId, remaining]`
- **Impatto**: l'effect si re-crea ad ogni tick (cleanup + recreate dell'interval). Funzionalmente il countdown è corretto, ma c'è drift se il render è lento (heavy parent re-rendering): il prossimo tick parte da `tick + render_time`, non `tick + 1000ms`. Su sessioni AMRAP da 12-20 min, deriva accumulabile.
- **Suggerimento**: rimuovere `remaining` dalle deps. Usare `setRemaining(r => r - 1)` (già fatto) e gestire la condizione di stop nel setter, non nelle deps.

### M6. `ActiveWorkout` mount-race: render con state stale prima della nuova session

- **Dove**: [`src/pages/athlete/ActiveWorkout.tsx:588-602`](src/pages/athlete/ActiveWorkout.tsx) — `stopSession()` è sincrono, ma `startSessionMutation.mutate({...})` ha latency. Tra i due c'è 1+ render con `activeSessionId = null`.
- **Impatto**: 100-500ms di "flash empty" — timer a 00:00, card "0/4 serie", nessun feedback che la sessione sta partendo. Brutto se l'atleta arriva da "Inizia Sessione".
- **Suggerimento**: render condizionale: `if (startSessionMutation.isPending && activeSessionId === null)` mostra spinner full-screen. Oppure optimistic update con UUID locale che viene rimpiazzato `onSuccess`.

### M7. Drawer state non sopravvive al close-reopen (Superset/Intensity/Amrap/Isometric)

- **Dove**: tutti e 4 i drawer non-Standard tengono lo state in `useState` locale. Aprendo → modificando → chiudendo → riaprendo lo stesso esercizio, lo state si resetta a `INITIAL`.
- **Impatto**: legato a C2 ma con sfumatura distinta. Anche se i drawer fossero collegati al DB (C2), il "lavoro in corso non ancora committato" si perderebbe al close, costringendo l'atleta a iniziare da zero.
- **Suggerimento**: portare il state in uno slice Zustand `useDrawerState({ [exerciseId]: ... })` che persiste tra open/close. Quando il drawer chiude senza commit, lo state resta in memoria; quando l'esercizio è marcato done, viene flushato.

### M8. Nessun ErrorBoundary sull'albero `/athlete/*`

- **Dove**: né `App.tsx` né `AthleteLayout.tsx` wrappano il subtree in un ErrorBoundary.
- **Impatto**: un singolo throw non gestito (es. `query.data.foo.bar` dove `.foo` è undefined) sbianca la pagina, l'atleta non sa cosa fare.
- **Suggerimento**: `<AthleteErrorBoundary>` in `AthleteLayout` con fallback UI ("Qualcosa è andato storto") + bottone "Torna al Training Hub".

### M9. Touch target sotto i 44px sui pulsanti score/RPE

- **Dove**: gli score pulsanti di `DailyCheckin.tsx:142` sono `h-10 w-10` (40px). Apple HIG e WCAG 2.5.5 raccomandano ≥ 44px. `PostWorkoutDebrief.tsx` RPE è già stato fixato a `w-11 h-11` (44px).
- **Suggerimento**: allineare DailyCheckin a `w-11 h-11` o `min-h-[44px] min-w-[44px]`.

---

## 🔵 Bassa (Low) — pulizia e robustezza

### B1. `crypto.randomUUID()` non disponibile in SSR / HTTP non-secure

- **Dove**: [`useAthleteWorkoutHooks.ts:66-67`](src/hooks/athlete/useAthleteWorkoutHooks.ts) (fallback sessione local-only). Stesso pattern in [`InviteAthleteDialog.tsx:112`](src/components/coach/InviteAthleteDialog.tsx).
- **Impatto**: oggi solo client (Vite + React), safe. Crash se viene introdotto SSR o se l'app è servita su `http://` non-secure.
- **Improvement**: polyfill `uuid` package + feature-detect.

### B2. `console.warn` in produzione per ogni utente non-autenticato

- **Dove**: [`useAthleteWorkoutHooks.ts:108-110`](src/hooks/athlete/useAthleteWorkoutHooks.ts) — sentinel utile in dev, rumore in prod.
- **Improvement**: `if (import.meta.env.DEV) console.warn(...)`.

### B3. Commenti "No Supabase wiring" sono datati

- **Dove**: header docblock di [`ActiveWorkout.tsx:33`](src/pages/athlete/ActiveWorkout.tsx), [`AthleteTraining.tsx:34`](src/pages/athlete/AthleteTraining.tsx), [`WorkoutPhaseDetail.tsx`](src/pages/athlete/WorkoutPhaseDetail.tsx).
- **Improvement**: documentare lo stato reale: "Backend wired for session + per-set logging. Exercise content still mock."

### B4. Commento stale "loggedSets[id]" in ActiveWorkout

- **Dove**: [`ActiveWorkout.tsx:76`](src/pages/athlete/ActiveWorkout.tsx) — `/** Stable id used as the key in \`loggedSets[id]\`. */`. Il `loggedSets` non esiste più nello store.
- **Improvement**: rinominare a "Stable id used as the `exercise_id` in `exercise_logs` rows."

### B5. 134 occorrenze di colori/shadow `[#...]` hardcoded nel training subtree

- **Dove**: grep su `bg-\[# / text-\[# / border-\[# / shadow-\[` → 134 hit, 17 di `#c0c7d0` ripetuti.
- **Improvement**: tokenizzare in `tailwind.config.ts`:
  - `colors.outline-soft: '#c0c7d0'`
  - `boxShadow.elevation-1/2/3` per le rgba ricorrenti

### B6. `Array.from({ length: N })` ricreato ad ogni render

- **Dove**: [`ActiveWorkout.tsx:344`](src/pages/athlete/ActiveWorkout.tsx) — pill segments del progress.
- **Improvement**: `useMemo` per il `targetSets <= 10` corrente è trascurabile, lasciar stare.

### B7. `Date.now()` come id locale può collidere

- **Dove**: [`IsometricDrawer.tsx:99`](src/components/athlete/drawers/IsometricDrawer.tsx) — `id: String(Date.now())`.
- **Improvement**: `crypto.randomUUID()` (con caveat di B1) o un counter ref.

### B8. Border-radius non semanticamente codificato

- **Dove**: mix arbitrario di `rounded-2xl` e `rounded-3xl` in tutti i page/drawer.
- **Improvement**: tokenizzare `borderRadius: { card: '1.5rem', surface: '2rem', chip: '9999px' }`.

---

## Sommario

| Severità | Count | Tema principale |
|---|---|---|
| 🔴 Critical | **5** | Mock exercise IDs (FK violation), 4/5 drawer no-persist, orphan workout_logs (discard + finish), mutation no-disabled |
| 🟡 Medium | **9** | Hardcoded content, NaN risk, no optimistic UI, focus trap, timer drift, mount race, drawer state lost, no error boundary, touch targets |
| 🔵 Low | **8** | crypto polyfill, console in prod, stale comments, design tokens, render allocations |
| **Totale** | **22** | |

## Top 5 punti di fallimento in produzione (in ordine di probabilità)

1. **Subito** — il primo set tappato genera FK violation, sessione persiste vuota in DB (C1)
2. **Quando l'atleta apre un drawer non-Standard** — Superset/AMRAP/Intensity/Isometric, dati persi al close (C2)
3. **Ogni volta che l'atleta tap "Annulla Workout"** — orphan `workout_logs` rimane `in_progress` per sempre (C3)
4. **Se l'atleta chiude il browser sul debrief** — sessione persiste `in_progress`, store inconsistente (C4)
5. **Su rete lenta, ogni Save** — possibile doppio click → doppia UPDATE (C5)

## Prossimi passi consigliati

### Priorità 1 — Sbloccare il flusso runtime (1-2 settimane)
1. Creare `useExercisesQuery()` + sostituire mock IDs con UUID reali (C1, M1)
2. Aggiungere `useDiscardSessionMutation` e cablarlo in `handleDiscard` (C3)
3. Mettere safety net per sessioni orfane (trigger Postgres "auto-skip after 6h") (C4)
4. Disabilitare bottoni durante mutation `isPending` (C5)

### Priorità 2 — Completare il data layer dei drawer (2-3 settimane)
5. Estendere `exercise_logs` schema con `set_type`, `duration_seconds`, `rounds`, `superset_group_id`
6. Replicare il pattern `useLogSetMutation` nei 4 drawer rimanenti (C2)
7. Lift dello state drawer in Zustand slice per sopravvivere al close (M7)

### Priorità 3 — Polish UX (sprint dedicato)
8. Optimistic update su `useLogSetMutation` (M3)
9. Switch da `ExitWorkoutDialog` custom a shadcn `<AlertDialog>` con focus trap (M4)
10. ErrorBoundary su AthleteLayout (M8)
11. Skeleton state durante mount race ActiveWorkout (M6)
12. Touch target ≥ 44px ovunque (M9)

### Priorità 4 — Hardening (low-pri)
13. Tokenizzare colori/shadow in Tailwind (B5, B8)
14. Polyfill crypto.randomUUID (B1)
15. Cleanup commenti datati e console.warn condizionali (B2, B3, B4)

---

## Note di traceability

Questo audit è complementare al [`ATHLETE_APP_AUDIT.md`](ATHLETE_APP_AUDIT.md) (audit broader che include readiness + onboarding + analytics). Le overlapping issue tra i due:

| Questo audit | ATHLETE_APP_AUDIT |
|---|---|
| C1 | H1 |
| C2 | H2 |
| C5 | H3 |
| M1 (parziale) | H8 + H9 |
| M2 | H7 |
| M4 | M8 |
| M5 | M2 |
| M6 | M3 |
| M7 | L7 |
| M8 | M4 |
| M9 | M9 |
| B1 | H5 + L10 |
| B2 | L1 |
| B3 | L4 |
| B4 | L5 |
| B5 | M1 |
| B6 | L2 |
| B7 | L3 |
| B8 | L6 |

**Nuove issue identificate da questo audit (non presenti nell'audit precedente)**:
- **C3** (orphan workout_logs su discard) — vera priority 1 mancante prima
- **C4** (orphan workout_logs se l'utente esce dal debrief) — race condition non documentata
- **M3** (no optimistic update su logSet) — UX detail non flaggata prima
