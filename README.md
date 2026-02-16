# FitCoach — Hybrid Coaching Platform

> **Project Status:** 🟡 Beta / Release Candidate

A full-stack coaching platform for hybrid (online + in-person) strength & conditioning coaches and their athletes. Built with React, TypeScript, Tailwind CSS, and Lovable Cloud.

---

## Tech Stack

- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion
- **Backend:** Lovable Cloud (Database, Auth, Edge Functions, Storage)
- **Payments:** Stripe (Subscriptions, Customer Portal, Webhooks)
- **State:** TanStack Query · Zustand
- **Testing:** Playwright (E2E)
- **PWA:** Service Worker · IndexedDB offline sync

---

## Getting Started

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```

---

## Running Tests

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

## Feedback Loop

Users can report bugs and suggest features directly inside the app:

- **Coach view:** Click the **"Supporto"** (LifeBuoy icon) item in the sidebar.
- **Athlete view:** Go to **Profile → "Segnala un Problema"** in the settings section.

Reports are stored in the `support_tickets` table with auto-captured browser metadata for faster debugging.

---

## Deployment

Open [Lovable](https://lovable.dev) and click **Share → Publish** to deploy the latest version.

To connect a custom domain, go to **Project → Settings → Domains → Connect Domain**.

---

## Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for the full changelog.
