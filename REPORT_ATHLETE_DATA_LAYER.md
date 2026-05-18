# Report — Implementazione Athlete Data Layer

**Branch**: `claude/flamboyant-hertz-937c2d`
**Commit principale**: `f0d785d` — `feat(athlete): wire readiness + workout sessions to Supabase via React Query`
**Data**: 2026-05-17
**Stato**: tsc verde, lint senza regressioni, working tree pulito, 1 commit avanti rispetto a `origin/main`.

---

## 0. Sommario esecutivo

L'app Athlete è passata da UI con dati mock (Zustand) a un data layer reale appoggiato a Supabase. Sono state aggiunte/modificate tabelle, generati hook React Query per la persistenza, e refattorizzati 5 file UI per consumare i nuovi hook. Gli store Zustand sono stati ridotti al solo stato UI locale (timer, ID sessione attiva, mappa metriche per trend dashboard, personalizzazione card).

Nessuna regressione di tipi (`tsc --noEmit` exit 0). Lint complessivo migliorato di 2 warning (orphan eslint-disable rimossi). Tutti i fallimenti di mutation surface tramite `toast.error` (sonner).

---

## 1. Lavoro completato

### 1a. Task 1 — Schema database

**Migrazione**: [`20260517170000_athlete_tracking_schema.sql`](supabase/migrations/20260517170000_athlete_tracking_schema.sql)

- `ALTER TABLE daily_readiness ADD COLUMN fatigue_score INTEGER CHECK (1..10)` — il dashboard mostra "Fatica" come metrica scalare; mancava la colonna persistente.
- `CREATE TABLE exercise_logs`:
  - `id UUID PK DEFAULT gen_random_uuid()`
  - `session_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE`
  - `exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT`
  - `set_number SMALLINT NOT NULL CHECK (set_number > 0)`
  - `weight NUMERIC(6,2) NOT NULL CHECK (>= 0)`
  - `reps SMALLINT NOT NULL CHECK (reps >= 0)`
  - `is_completed BOOLEAN NOT NULL DEFAULT true`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `UNIQUE (session_id, exercise_id, set_number)` — protezione contro doppi click
- **5 policy RLS** su `exercise_logs`:
  - Athlete SELECT/INSERT/UPDATE/DELETE solo righe della propria sessione (predicate: `EXISTS (SELECT 1 FROM workout_logs WHERE workout_logs.id = exercise_logs.session_id AND workout_logs.athlete_id = auth.uid())`)
  - Coach SELECT sulle sessioni degli atleti assegnati (JOIN su `profiles` filtrato su `profiles.coach_id = auth.uid()` — non esiste una tabella `coach_athletes`)
- Index aggiuntivi su `(session_id)` e `(exercise_id)` (due indici singoli, non composto) per query rapide nel dashboard.

**Patch `types.ts`**: aggiunto `fatigue_score` in Row/Insert/Update di `daily_readiness` e bloccato di `exercise_logs` completo (Row/Insert/Update/Relationships).

**Rimozione HRV** dal frontend Athlete (decisione presa durante Task 1 — `daily_readiness.hrv_value` esiste già nel DB ma il brief Phase 2 escludeva HRV dal flusso atleta):
- `useAthleteReadinessStore`: rimosso "HRV" da `METRIC_KEYS` (7 metriche → 6)
- `AthleteDashboard.tsx`: rimosso dal selettore metriche del card Prontezza
- `DailyReadiness.tsx`: docblock pulito

### 1b. Task 2 — Data Access Layer (questo commit)

**Migrazione aggiuntiva**: [`20260517171000_workout_logs_optional_workout.sql`](supabase/migrations/20260517171000_workout_logs_optional_workout.sql)

```sql
ALTER TABLE public.workout_logs ALTER COLUMN workout_id DROP NOT NULL;
```

Motivazione: l'app Atleta consente sessioni freestyle (allenamento ad-hoc senza workout coach-assegnato). Il row `workout_logs` serve come FK target per `exercise_logs`, ma non si può richiedere un `workouts` row parent.

**Hook React Query** in [`src/hooks/athlete/`](src/hooks/athlete/):

[`useAthleteReadinessHooks.ts`](src/hooks/athlete/useAthleteReadinessHooks.ts):

| Hook | Tipo | Operazione | Cache key |
|---|---|---|---|
| `useDailyReadinessQuery(date)` | Query | SELECT riga `daily_readiness` per athlete + date | `["daily-readiness", athleteId, date]` |
| `useSubmitReadinessMutation()` | Mutation | UPSERT su `(athlete_id, date)` con onConflict | invalida `["daily-readiness", athleteId, date]` |

[`useAthleteWorkoutHooks.ts`](src/hooks/athlete/useAthleteWorkoutHooks.ts):

| Hook | Tipo | Operazione | Cache key |
|---|---|---|---|
| `useStartSessionMutation()` | Mutation | INSERT `workout_logs` status='in_progress' | — |
| `useLogSetMutation()` | Mutation | INSERT `exercise_logs` | invalida `["session-sets", sessionId]` |
| `useFinishSessionMutation()` | Mutation | UPDATE `workout_logs` con completed_at/duration_seconds/rpe_global/notes/status='completed' | invalida `["session-sets", sessionId]` |
| `useSessionSetsQuery(sessionId)` | Query | SELECT `exercise_logs` per session, ORDER BY set_number | `["session-sets", sessionId]` |

Tutte le mutation hanno `onError` con `toast.error()`:
- "Salvataggio Prontezza fallito"
- "Avvio sessione fallito"
- "Salvataggio serie fallito"
- "Chiusura sessione fallita"

**Refactor store Zustand** (UI-only state):

[`useAthleteWorkoutStore.ts`](src/stores/useAthleteWorkoutStore.ts):
- ❌ Rimossi: `loggedSets: Record<exerciseId, SetEntry[]>`, `logSet(exerciseId, weight, reps)`, type export `SetEntry`
- ✅ Aggiunto: `activeSessionId: string | null`
- 🔄 Modificato: `startSession()` → `startSession(sessionId: string)` — ora richiede l'id dal DB
- Persisted slice include `activeSessionId` per supportare resume cross-refresh

[`useAthleteReadinessStore.ts`](src/stores/useAthleteReadinessStore.ts):
- ❌ Rimossi: `dailyScore: number | null`, `isCompletedToday: boolean` — ora derivati da `useDailyReadinessQuery`
- ✅ Mantenuti: `metrics: MetricsMap` (today/yesterday locale per trend rows), `selectedDashboardMetrics: MetricKey[]` (personalizzazione card)
- 🔄 `submitDailyCheckin` semplificato: aggiorna solo `metrics[*].today` (niente più flag/score)

**Refactor componenti UI**:

| File | Cambiamento principale |
|---|---|
| [`DailyCheckin.tsx`](src/pages/athlete/DailyCheckin.tsx) | `handleSave` chiama `submitReadiness.mutate(...)` con payload mappato sui nomi colonna DB; mantiene anche `submitDailyCheckin(payload)` locale per snappy UI prima del round-trip. Su `onSuccess`: toast + navigate. |
| [`AthleteDashboard.tsx`](src/pages/athlete/AthleteDashboard.tsx) | `useDailyReadinessQuery(todayIso())` in due punti: ReadinessCard (per `ringValue`) e main page (per il branch navigazione checkin vs analysis). Rimosso import `useAthleteWorkoutStore` e `startSession()` da `handleStartWorkout`. |
| [`ActiveWorkout.tsx`](src/pages/athlete/ActiveWorkout.tsx) | `useCompletedSetCount(exerciseId)` ora legge da `useSessionSetsQuery(activeSessionId)` filtrato per exercise_id. Mount effect chiama `useStartSessionMutation` (skip se `activeSessionId` già impostato = resume). `handleFinish` NON chiama più `stopSession()` — il debrief ha bisogno dell'id. |
| [`StandardSetDrawer.tsx`](src/components/athlete/drawers/StandardSetDrawer.tsx) | "Aggiungi Set" → `logSetMutation.mutate({ session_id: activeSessionId, exercise_id, set_number: completedSets.length + 1, weight, reps })`. Disabilitato durante `isPending` o se `activeSessionId === null`. Key per `<li>` ora `set.id` invece di indice. |
| [`PostWorkoutDebrief.tsx`](src/pages/athlete/PostWorkoutDebrief.tsx) | `SessionStatsCard` deriva `totalSetsCompleted` + `totalVolumeKg` da `useSessionSetsQuery(activeSessionId).data`. `handleSave` chiama `finishSession.mutate({ session_id, duration_seconds: elapsedTime, rpe_global, notes })`; su success: toast + stopSession + navigate. Defensive guard se `activeSessionId` null. |

### 1c. Mapping payload `daily_readiness`

In `DailyCheckin.handleSave`, i 5 input biofeedback (1-5 scale) + soreness sono mappati così:

| Form input | Colonna DB | Trasformazione |
|---|---|---|
| `biofeedback.sleep` | `sleep_quality` | `n * 2` (1-5 → 2-10) |
| `biofeedback.stress` | `stress_level` | `n * 2` |
| `biofeedback.energy` | `fatigue_score` | `(6 - n) * 2` (energia alta = fatica bassa) |
| `biofeedback.mood` | `mood` | `n * 2` |
| `biofeedback.digestion` | `digestion` | `n * 2` |
| `soreness: Record<MuscleId, Intensity>` | `soreness_map` (JSONB) | passato direttamente |
| _(placeholder)_ | `score` | `85` hardcoded |

---

## 2. Fix applicati durante la sessione

| Problema | Causa | Fix |
|---|---|---|
| Edit/Write scrivevano nel main repo invece che nel worktree | I path assoluti puntavano a `C:\Users\wolfw\Documents\GitHub\nc-performace-hub\...` invece di `...\.claude\worktrees\flamboyant-hertz-937c2d\...` | Sincronizzato con `cp` da main repo → worktree, verificato con `diff -rq` e `tsc` rieseguito sul worktree |
| Commenti `// eslint-disable-next-line no-console` orfani | I `console.info` adiacenti sono stati rimossi durante l'edit handler, ma in alcuni passaggi il commento è rimasto | Inclusi nel `old_string` del replacement (verificato grep: nessun residuo) |
| Riferimenti HRV in commenti e docblock | Decisione di rimuovere HRV dal flusso atleta arrivata dopo il primo draft | Commenti aggiornati in store + dashboard + DailyReadiness |
| Mock di yesterday in store conteneva "HRV: 7" | Stesso motivo | Rimosso da `MOCK_YESTERDAY` dict |

---

## 3. Problemi ancora presenti

### 3a. 🔴 Runtime: FK violation con mock exercises (alto)
- **Causa**: `exercise_logs.exercise_id` è hard FK a `exercises.id` (UUID), ma `AthleteTraining.tsx` definisce esercizi mock con ID arbitrari (`"a1"`, `"b1"`, `"c1"`, `"1"`, `"2"`, ...).
- **Sintomo**: il primo tap su "Aggiungi Set" su qualsiasi esercizio mock fallirà a runtime con errore Postgres FK; il toast "Salvataggio serie fallito" comparirà.
- **Impatto**: type-safe ma non runtime-safe finché la libreria esercizi non è popolata e gli ID nei mock sostituiti con UUID reali da `exercises` table.

### 3b. 🟡 Placeholder `daily_readiness.score = 85` (medio)
- `DailyCheckin` invia sempre `score: 85`. Preserva il comportamento mock preesistente ma è inutile come metrica.
- Il composito reale dovrebbe pesare sleep_quality, fatigue_score, stress_level, soreness_map → 0-100.
- Logica già esistente in [`src/lib/math/readinessMath.ts`](src/lib/math/readinessMath.ts) ma non ancora collegata.

### 3c. 🟡 Trend "yesterday" ancora mock (basso)
- `MOCK_YESTERDAY` in `useAthleteReadinessStore` resta hardcoded.
- Le mini-row del dashboard mostrano frecce ↑/↓ confrontando today (mock oggi, da store) con yesterday (mock). Anche dopo refactor non sono DB-backed.
- Soluzione: aggiungere una `useDailyReadinessQuery(yesterdayIso())` accanto a quella di oggi e passare entrambi i row alle mini-row.

### 3d. 🟡 Per-metric values dashboard ancora da store (basso)
- Le mini-row metriche leggono ancora da `store.metrics[key].today` (locale), non dal `daily_readiness` row del DB.
- Il refactor è coerente con il brief ("display real score") che si riferiva solo a `dailyScore` + `isCompletedToday`. Le trend row sono out of scope ma vanno completate.

### 3e. 🟡 Sessione orfana se utente abbandona ActiveWorkout via "Annulla" (basso)
- `handleDiscard` chiama solo `stopSession()` locale; il row `workout_logs` con `status='in_progress'` resta nel DB.
- Non blocca nulla ma sporca i dati. Soluzione: nuovo `useDiscardSessionMutation` che fa `UPDATE status='skipped'` (o DELETE) prima del local clear.

### 3f. ⚪ Lint preesistente non risolto (informativo, non regressione)
- 73 problemi totali nel repo (54 errors, 19 warnings) — tutti in file NON toccati:
  - `src/lib/offlineStorage.ts` (`any` types)
  - `src/pages/coach/AthleteDetail.tsx`, `CoachCalendar.tsx`, `CoachCheckinInbox.tsx`
  - `src/providers/MaterialYouProvider.tsx`, `OfflineSyncProvider.tsx`
  - `src/types/onboarding.ts`
  - `supabase/functions/check-achievements/index.ts`, `generate-program/index.ts`
  - `tailwind.config.ts`
  - `src/pages/athlete/WeeklyCheckin.tsx` (orphan eslint-disable)
- Il commit ha ridotto i warning totali da 75 → 73 (i 2 orphan eslint-disable nei miei file sono stati rimossi).

### 3g. ⚪ Warning CRLF Windows (benigno)
- Git mostra warning di conversione LF→CRLF su 6 file. Solo line-ending normalization, nessun impatto sul contenuto né sulla portabilità.

---

## 4. Prossimi passi consigliati

### Priorità 1 — Sbloccare il flusso end-to-end runtime

1. **Applicare le migrazioni al DB remoto** — `npx supabase db push` (o equivalente). Il codice è committato ma le tabelle non esistono ancora in produzione.
2. **Seed `exercises` table** — popolare la libreria del coach con esercizi reali (UUID generati da Postgres). Senza questo `useLogSetMutation` fallisce sempre.
3. **Sostituire mock exercise IDs in `AthleteTraining.tsx`** — creare un nuovo `useExercisesQuery()` hook (lettura da `exercises`) e usarlo al posto dell'array hardcoded.

### Priorità 2 — Allineare composito + trend al DB

4. **Calcolo lato server di `daily_readiness.score`** — opzione A: trigger Postgres BEFORE INSERT/UPDATE che computa il composito da sleep_quality, fatigue_score, stress_level, soreness_map. Opzione B: RPC `compute_readiness_score(athlete_id, date)` chiamata pre-upsert dal mutation.
5. **Yesterday query nel dashboard** — aggiungere `useDailyReadinessQuery(yesterdayIso())` accanto a quella di oggi; passare i due row alle mini-row così le frecce trend riflettono dati DB.
6. **Per-metric values DB-backed** — refactor delle mini-row metriche per leggere `query.data?.sleep_quality` etc. invece di `store.metrics[key].today`. Lo store `metrics` può diventare puro cache per le forme di input o essere rimosso.

### Priorità 3 — Polish e robustezza

7. **`handleDiscard` pulisce DB** — `useDiscardSessionMutation` con `UPDATE workout_logs SET status='skipped'` (preferito a DELETE per audit trail) prima del local stopSession.
8. **Pending state UI nei form** — disabilitare i pulsanti di submit mentre `mutation.isPending` è true (parzialmente già fatto in `StandardSetDrawer`, da estendere a `DailyCheckin` e `PostWorkoutDebrief`).
9. **Optimistic update sui sets** — `useLogSetMutation` con `onMutate` che inietta la nuova riga nella cache prima della conferma server; rollback in `onError`. Rende il drawer ancora più reattivo.
10. **Risoluzione lint preesistenti** — tipizzare gli `any` in `offlineStorage.ts`, coach pages, supabase functions. Lavoro a sé stante, ~54 errori.

### Priorità 4 — Architettura

11. **Coach-side hooks** — una volta che gli atleti scrivono dati veri, costruire l'equivalente lato coach: `useAthleteSessionsList`, `useAthleteReadinessHistory`, `useAthleteRecentVolume` per popolare la dashboard del coach.
12. **Real-time sync** — Supabase realtime subscription su `workout_logs` perché il coach veda live "Mario sta facendo squat ora". Da valutare il costo in connessioni concurrent (Supabase free tier ne ha pochi).

---

## 5. Verifica finale

| Check | Esito |
|---|---|
| `npx tsc --noEmit` (worktree, post-sync) | ✅ exit 0, zero errori |
| `npm run lint` sui miei file | ✅ pulito |
| Whole-repo lint | 73 problemi (tutti preesistenti, 2 in meno del baseline) |
| `git status` post-commit | ✅ working tree clean |
| Commit `f0d785d` | ✅ 13 files, +757/-274 |
| Branch state | ✅ `claude/flamboyant-hertz-937c2d` ahead of `origin/main` by 1 |
| File nuovi creati esistono | ✅ 4 file (2 hooks + 2 migrazioni) |
| Hook export sanity check | ✅ `useDailyReadinessQuery`, `useSubmitReadinessMutation`, `useStartSessionMutation`, `useLogSetMutation`, `useFinishSessionMutation`, `useSessionSetsQuery` tutti presenti |
| UI consumer sanity check | ✅ tutte le 5 pagine importano e chiamano i nuovi hook |

---

## 6. File toccati (commit `f0d785d`)

### File nuovi (4)

- `src/hooks/athlete/useAthleteReadinessHooks.ts` (+124)
- `src/hooks/athlete/useAthleteWorkoutHooks.ts` (+206)
- `supabase/migrations/20260517170000_athlete_tracking_schema.sql` (+105)
- `supabase/migrations/20260517171000_workout_logs_optional_workout.sql` (+11)

### File modificati (9)

- `src/components/athlete/drawers/StandardSetDrawer.tsx` (87 righe modificate)
- `src/integrations/supabase/types.ts` (+57)
- `src/pages/athlete/ActiveWorkout.tsx` (59 righe modificate)
- `src/pages/athlete/AthleteDashboard.tsx` (27 righe modificate)
- `src/pages/athlete/DailyCheckin.tsx` (+33)
- `src/pages/athlete/DailyReadiness.tsx` (8 righe — HRV cleanup)
- `src/pages/athlete/PostWorkoutDebrief.tsx` (98 righe modificate)
- `src/stores/useAthleteReadinessStore.ts` (91 righe modificate, net negativo)
- `src/stores/useAthleteWorkoutStore.ts` (125 righe modificate, net negativo significativo)

**Totale: 13 file, +757 / -274 righe.**
