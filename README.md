# 🏋️ Coach Athlete Hub — High Performance SaaS

> "God-Mode" analytics for coaches. Offline-first performance for athletes.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Integrated-635BFF?logo=stripe&logoColor=white)
![Beta](https://img.shields.io/badge/Status-Beta_Active-orange)

---

## 📖 Project Overview

**Coach Athlete Hub** is a full-stack coaching platform for hybrid (online + in-person) strength & conditioning professionals.

- 🧠 **Coach Dashboard** — A desktop-first command center with program building, real-time analytics (ACWR, volume load, readiness), business automation (Stripe subscriptions, invoicing), and AI-powered tools.
- 📱 **Athlete App** — A mobile-first PWA with offline workout logging, VBT tracking, nutrition AI, gamification, and a Focus Dashboard that gates training behind daily readiness check-ins.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion |
| **State** | TanStack Query v5 (IndexedDB persistence) · Zustand |
| **Backend** | Lovable Cloud (PostgreSQL · Auth · Storage · Edge Functions) |
| **Payments** | Stripe (Subscriptions · Customer Portal · Webhooks) |
| **Testing** | Playwright (E2E) |
| **PWA** | Service Worker · IndexedDB offline sync · Wake Lock API |

---

## ✨ Features

### 🏋️ Training Logic
- Drag-and-drop Program Builder with multi-week periodization
- Offline-first Workout Player with rest timers and RPE logging
- Velocity Based Training (VBT) — mean/peak velocity, power output
- ACWR monitoring and automated risk alerts

### 🍎 Nutrition AI
- AI-powered meal photo analysis (`analyze-meal-photo`)
- Calorie banking and adaptive TDEE calculations
- Coach-defined nutrition plans with macro cycling

### 💼 Business Automation
- Stripe subscription management and Customer Portal
- Invoice tracking and one-off payment requests
- Coach-defined billing plans with automated lifecycle

### 💬 Communication
- Real-time 1:1 and broadcast messaging
- AI-assisted coach chat with knowledge base context

### 🏆 Gamification
- Badge system, workout streaks, and leaderboard
- Anonymous mode for privacy-conscious athletes

---

## 🛠 Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## 🧪 Testing

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npx playwright test

# Run tests with UI mode
npx playwright test --ui
```

Tests cover authentication flows, route protection, and 404 handling. See `e2e/core-auth.spec.ts`.

---

## 💬 Support

Users can report bugs and suggest features directly inside the app:

- **Coach view:** Click the **"Supporto"** (LifeBuoy icon) item in the sidebar.
- **Athlete view:** Go to **Profile → "Segnala un Problema"** in the settings section.

Reports are stored with auto-captured browser metadata for faster debugging.

---

## 🚢 Deployment

Open [Lovable](https://lovable.dev) and click **Share → Publish** to deploy the latest version.

To connect a custom domain, go to **Project → Settings → Domains → Connect Domain**.

---

## 📝 Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for the full changelog.

---

## 🔒 Browser Policy Compliance

- **Notification permissions** are requested only on user gesture (not on mount), per browser security requirements.
- **Audio context** uses a silent warm-up oscillator for iOS compatibility.
- **Wake Lock API** keeps the screen active during workout sessions.
