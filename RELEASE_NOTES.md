# v1.0.0-rc.2

> **Release Date:** 2026-02-18

---

## Changes since rc.1

### 🔊 Audio Feedback — iOS Warm-Up
- `unlockAudio()` now plays a silent 0.1s oscillator on user gesture to prevent iOS AudioContext suspension.

### 🔔 Notification Permissions — Browser Policy Fix
- Removed `Notification.requestPermission()` from `useEffect` mount (was silently blocked by browsers).
- Permission is now requested inside `unlockAudio()` (triggered by user gesture), ensuring the prompt actually appears.
- Exported `enableNotifications()` helper from `RestTimerPill.tsx` for explicit manual triggers.

### 🛡️ Safe Finish Guard
- "Finish Workout" (`HoldToFinishButton`) now opens an `AlertDialog` confirmation before ending the session.
- Shows completed sets count (e.g., "Hai completato 3 di 10 serie").
- If no sets are logged, warns the user and styles the action as destructive ("Annulla sessione").

### 📱 Wake Lock
- `WorkoutPlayer` activates the Wake Lock API during active sessions, keeping the screen on for timer visibility.

---

# v1.0.0-rc.1 (Beta Release Candidate)

> **Release Date:** 2026-02-16

---

## Core Features Implemented

### 🔐 Authentication & Authorization
- Dual-role system (Coach vs Athlete) with secure email/password sign-up and role selection.
- Role-based routing: coaches → `/coach`, athletes → `/athlete`.
- Protected routes with automatic redirect to `/auth` for unauthenticated users.
- Row Level Security (RLS) enforced across all database tables.

### 💳 Payments — Stripe Integration
- Coach-defined billing plans with Stripe subscriptions.
- Athlete subscription management via Stripe Customer Portal.
- Webhook-driven subscription lifecycle (active, past_due, canceled).
- In-app invoice tracking and one-off payment request dialogs.

### 🏋️ Training Engine
- **Program Builder:** Drag-and-drop periodization with multi-week macro cycles, RPE/RIR logic, and exercise library.
- **Workout Player:** Live session tracking with rest timers, set logging, and RPE capture.
- **VBT:** Velocity Based Training metrics — mean/peak velocity, power output, and auto-regulation.
- **ACWR:** Acute:Chronic Workload Ratio monitoring with risk alerts for coaches.

### 📱 PWA — Offline-First Architecture
- Service Worker with offline-first caching strategy.
- TanStack Query v5 persistence via IndexedDB (`idb-keyval`) — `staleTime: Infinity`, `gcTime: 24h`.
- Wake Lock API to prevent screen sleep during active sessions.
- Local workout queue (IndexedDB) that syncs automatically on reconnect.
- Installable PWA with manifest and app icons.

### 📝 Support — Integrated Feedback Widget
- In-app `FeedbackDialog` with category selection (bug, feature_request, billing, other) and Zod validation.
- Auto-captured diagnostics: URL, userAgent, screen resolution, PWA mode.
- `support_tickets` table with RLS (users manage own tickets, coaches view athlete tickets).
- Coach: Sidebar → "Supporto" (LifeBuoy icon). Athlete: Profile → "Segnala un Problema".

### 🍎 Nutrition Tracking
- Meal logging with macro breakdown (protein, carbs, fats, calories).
- AI-powered meal photo analysis via `analyze-meal-photo` edge function.
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

### 🧪 QA — End-to-End Testing
- Playwright test suite (`e2e/core-auth.spec.ts`) covering:
  1. Public landing page loads with title and login CTA.
  2. Auth page renders email/password form fields.
  3. Protected `/coach` route redirects unauthenticated users.
  4. Protected `/coach/programs` route redirects unauthenticated users.
  5. Protected `/athlete` route redirects unauthenticated users.
  6. 404 page renders for unknown routes.

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

---

## Known Limitations

- First load may be slower on low-end devices due to initial offline sync.
- Email verification required before sign-in (auto-confirm is disabled).
- Offline feedback dialog warns but does not queue submissions for later sync.
- Admin dashboard for support tickets not yet available (managed via backend views).
- VBT camera analysis depends on device camera quality and lighting conditions.
- Leaderboard scoped per-coach roster; cross-platform leaderboards not yet supported.
