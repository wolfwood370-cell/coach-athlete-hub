# 🏋️ Coach Athlete Hub

> High-Ticket Coaching Platform — Release Candidate 5

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Integrated-635BFF?logo=stripe&logoColor=white)
![Status](https://img.shields.io/badge/Status-RC5-orange)

---

## Architecture Overview

Coach Athlete Hub is a **dual-interface** SaaS platform for hybrid (online + in-person) strength & conditioning professionals.

| Interface | Target | Optimized For |
|---|---|---|
| **Coach Dashboard** | Desktop web | Program design, analytics, business ops |
| **Athlete App** | Mobile PWA | Workout execution, nutrition, daily check-ins |

### Tech Stack

| Layer | Technology |
|---|---|
| **UI** | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion |
| **State** | TanStack Query v5 (IndexedDB persistence) · Zustand |
| **Backend** | Supabase (PostgreSQL · Auth · Realtime · Storage · Edge Functions) |
| **Payments** | Stripe (Subscriptions · Customer Portal · Webhooks) |
| **PWA** | Service Worker · IndexedDB offline sync · Wake Lock API · Web Audio API |
| **Testing** | Playwright (E2E) |

---

## Core Features — Coach Dashboard

- **Macro/Micro Periodization Planner** — Drag-and-drop program builder with multi-week macro cycles, RPE/RIR logic, block templates, and a full exercise library.
- **Real-Time Client Analytics** — ACWR monitoring, volume/intensity trends, velocity-based training charts, and automated risk alerts.
- **Readiness Tracking** — Daily readiness scores, sleep/HRV/stress dashboards, and FMS screening history per athlete.
- **Real-Time Chat** — 1:1 and broadcast messaging via Supabase WebSockets with AI-assisted coach responses and knowledge base context.
- **Business Automation** — Stripe subscription management, invoice tracking, one-off payment requests, and coach-defined billing plans.

---

## Core Features — Athlete PWA

- **Offline-First Workout Execution** — TanStack Query v5 with IndexedDB persistence (`staleTime: Infinity`, `gcTime: 24h`). Local workout queue syncs automatically on reconnect.
- **High-Precision Timers** — Timestamp-based rest timers (drift-proof even under screen lock). Stale timer rehydration on app reload.
- **Web Audio API** — iOS-compatible audio feedback with silent oscillator warm-up on user gesture.
- **Dynamic Onboarding** — Multi-step wizard (biometrics, lifestyle, neurotype profiling) gating the Focus Dashboard behind daily readiness check-ins.
- **Nutrition AI** — Meal photo analysis, calorie banking, adaptive TDEE, and coach-defined macro cycling.
- **Gamification** — Badge system, workout streaks, leaderboard with anonymous mode.

---

## Local Development Setup

### Prerequisites

- Node.js 18+ or Bun 1.x
- A Supabase project (or Lovable Cloud)

### Install & Run

```bash
# Install dependencies
npm install
# or
bun install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

These are auto-configured when using Lovable Cloud.

---

## Testing

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run E2E suite
npx playwright test

# Interactive UI mode
npx playwright test --ui
```

Tests cover auth flows, route protection, and 404 handling. See `e2e/core-auth.spec.ts`.

---

## Deployment

The app is a static SPA built with Vite. Deploy to any static hosting provider:

| Provider | Command |
|---|---|
| **Lovable** | Share → Publish |
| **Vercel** | `vercel --prod` (auto-detects Vite) |
| **Netlify** | Build command: `npm run build` · Publish dir: `dist` |

For custom domains, configure DNS and update the hosting provider settings.

---

## Support

In-app feedback is available for both roles:

- **Coach:** Sidebar → "Supporto" (LifeBuoy icon)
- **Athlete:** Profile → "Segnala un Problema"

Reports include auto-captured browser diagnostics (URL, userAgent, screen size, PWA mode).

---

## License

Private — All rights reserved.
