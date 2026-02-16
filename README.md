# 🏋️ Coach Athlete Hub (SaaS Platform)

> The world's most advanced coaching ecosystem. "God-Mode" analytics for coaches, offline-first performance for athletes.

---

## 🚀 Project Status

| Field | Value |
|---|---|
| **Current Version** | `v1.0.0-rc.1` (Beta Ready) |
| **Status** | Feature Complete / QA Phase |
| **Release Date** | 2026-02-16 |

---

## 🏗 Architecture & Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion |
| **State Management** | TanStack Query v5 with IndexedDB persistence (offline-first) · Zustand |
| **Backend** | Lovable Cloud (PostgreSQL, Auth, Storage, Edge Functions) |
| **Payments** | Stripe (Subscriptions, Customer Portal, Webhooks) |
| **Testing** | Playwright (E2E) |
| **PWA** | Service Worker · IndexedDB offline sync · Installable manifest |

---

## ✨ Key Features

### 🧠 For Coaches (Web Dashboard)

- **Program Builder:** Drag-and-drop periodization with multi-week macro cycles, RPE/RIR logic, and exercise library.
- **Analytics Suite:** Real-time dashboards for Readiness, Volume Load, ACWR monitoring, and risk alerts.
- **Business Logic:** Automated subscription management, invoice tracking, and payouts via Stripe.
- **AI Tools:** `generate-program` (LLM-powered program generation) and `analyze-meal-photo` (Vision-based food analysis).
- **Messaging:** Real-time 1:1 and broadcast chat with AI-assisted coaching context.
- **Content Library:** Centralized resource management with tagging and sharing.

### 📱 For Athletes (PWA Mobile)

- **Offline Mode:** Fully functional workout player without internet — syncs automatically on reconnect.
- **VBT & Logging:** Velocity Based Training tracking with mean/peak velocity, power output, and auto-regulating sets.
- **Nutrition:** AI-powered food logging, calorie banking, adaptive TDEE, and macro adherence visualization.
- **Gamification:** Badge system, workout streaks, and leaderboard with anonymous mode.
- **Feedback:** Integrated support widget for bug reporting with auto-captured diagnostics.
- **Focus Dashboard:** Material You–themed home screen with readiness gating and dynamic intensity warnings.

---

## 🛠 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 🧪 Running Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npx playwright test

# Run tests with UI mode
npx playwright test --ui
```

### Test Coverage

Tests in `e2e/core-auth.spec.ts` verify:

1. ✅ Public landing page loads with title and login CTA.
2. ✅ Auth page renders email/password form fields.
3. ✅ Protected `/coach` route redirects unauthenticated users.
4. ✅ Protected `/coach/programs` route redirects unauthenticated users.
5. ✅ Protected `/athlete` route redirects unauthenticated users.
6. ✅ 404 page renders for unknown routes.

---

## 💬 Feedback Loop

Users can report bugs and suggest features directly inside the app:

| Role | Location | Trigger |
|---|---|---|
| **Coach** | Sidebar footer | Click **"Supporto"** (LifeBuoy icon) |
| **Athlete** | Profile → Settings | Click **"Segnala un Problema"** |

Reports are stored in the `support_tickets` table with auto-captured browser metadata (URL, userAgent, screen resolution, PWA mode) for faster debugging.

---

## 🗄 Database Schema Summary

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

## 🚢 Deployment

Open [Lovable](https://lovable.dev) and click **Share → Publish** to deploy the latest version.

To connect a custom domain, go to **Project → Settings → Domains → Connect Domain**.

---

## ⚠️ Known Limitations

- **Email verification:** Users must verify email before signing in (auto-confirm is disabled).
- **Offline feedback:** Feedback dialog warns when offline but does not queue submissions for later sync.
- **Admin dashboard:** Support ticket management is done via backend database views; no in-app admin panel yet.
- **VBT camera analysis:** Bar path detection relies on device camera quality and lighting conditions.
- **Leaderboard:** Currently scoped per-coach roster; cross-platform leaderboards not yet supported.

---

## 📄 License

Proprietary — All rights reserved.

---

## 📝 Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for the full changelog.
