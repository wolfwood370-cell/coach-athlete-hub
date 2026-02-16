# v1.0.0-beta.1 (Release Candidate)

> **Release Date:** 2026-02-16

---

## Core Features

### 🔐 Authentication & Authorization
- Email/password sign-up and sign-in with role selection (Coach / Athlete).
- Role-based routing: coaches → `/coach`, athletes → `/athlete`.
- Protected routes with automatic redirect to `/auth` for unauthenticated users.
- RLS (Row Level Security) enforced across all database tables.

### 💳 Stripe Subscriptions & Billing
- Coach-defined billing plans with Stripe integration.
- Athlete subscription management via Stripe Customer Portal.
- Webhook-driven subscription lifecycle (active, past_due, canceled).
- In-app invoice tracking and payment request dialogs.

### 🏋️ Training Engine
- Program Builder with multi-week periodization (macro cycles, phases).
- Workout Player with live session tracking, rest timers, and RPE logging.
- Velocity-Based Training (VBT) metrics: mean/peak velocity, power output.
- ACWR (Acute:Chronic Workload Ratio) monitoring and risk alerts.
- Exercise library with muscle tags, movement patterns, and video references.

### 📱 Offline PWA
- Service Worker with offline-first caching strategy.
- IndexedDB queue for workout logs synced on reconnect.
- Network status badge and sync indicator.
- Installable PWA with manifest and app icons.

### 📝 Feedback & Support System
- In-app `FeedbackDialog` with category selection and Zod validation.
- Auto-captured metadata: URL, userAgent, screen resolution, PWA mode.
- `support_tickets` table with RLS (users manage own tickets, coaches view athlete tickets).
- Integrated into Coach Sidebar ("Supporto") and Athlete Profile ("Segnala un Problema").

### 🍎 Nutrition Tracking
- Meal logging with macro breakdown (protein, carbs, fats, calories).
- AI-powered meal photo analysis via backend function.
- Calorie banking and adaptive TDEE calculations.
- Coach-defined nutrition plans with cycling targets.

### 💬 Messaging
- Real-time 1:1 chat between coach and athlete.
- AI-assisted coach chat with knowledge base context.
- Broadcast messaging support.

### 🏆 Gamification
- Badge system with categories and thresholds.
- Workout streak tracking.
- Leaderboard with anonymous mode option.

---

## Database Schema Summary

| Table | Purpose |
|---|---|
| `profiles` | User identity, role, settings, onboarding data |
| `workouts` / `workout_logs` | Workout definitions and completion logs |
| `workout_exercises` | Per-exercise sets data with VBT metrics |
| `program_plans` / `program_weeks` / `program_days` / `program_workouts` / `program_exercises` | Periodized program builder hierarchy |
| `training_phases` | Macro-cycle periodization phases |
| `daily_readiness` / `daily_metrics` | Athlete wellness and biometric tracking |
| `nutrition_plans` / `nutrition_logs` / `meal_logs` | Nutrition programming and logging |
| `support_tickets` | Bug reports and feedback (with metadata) |
| `athlete_subscriptions` / `billing_plans` | Stripe-backed subscription management |
| `chat_rooms` / `messages` / `chat_participants` | Real-time messaging system |
| `badges` / `user_badges` | Gamification achievements |
| `coach_alerts` | Risk and compliance alerts for coaches |
| `exercises` | Coach exercise library |
| `fms_tests` / `injuries` | Movement screening and injury tracking |

---

## E2E Test Coverage

Tests in `e2e/core-auth.spec.ts` verify:

1. ✅ Public landing page loads with title and login CTA.
2. ✅ Auth page renders email/password form fields.
3. ✅ Protected `/coach` route redirects unauthenticated users.
4. ✅ Protected `/coach/programs` route redirects unauthenticated users.
5. ✅ Protected `/athlete` route redirects unauthenticated users.
6. ✅ 404 page renders for unknown routes.

---

## Known Limitations

- **Email verification:** Users must verify email before signing in (auto-confirm is disabled).
- **Offline feedback:** Feedback dialog warns when offline but does not queue submissions for later sync.
- **Admin dashboard:** Support ticket management is done via backend database views; no in-app admin panel yet.
- **VBT camera analysis:** Bar path detection relies on device camera quality and lighting conditions.
- **Leaderboard:** Currently scoped per-coach roster; cross-platform leaderboards not yet supported.
