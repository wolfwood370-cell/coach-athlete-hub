# QA Manual Test Checklist — v1.0.0-rc.6

> Last updated: 2026-02-20

---

## 🧠 Smart Readiness Insights

- [ ] Complete the morning check-in with **sleep < 6h** → verify the insight says "Hai dormito poco…".
- [ ] Complete the check-in with **stress > 7** → verify the insight mentions stress and technical focus.
- [ ] Complete the check-in with **soreness > 7** → verify the insight mentions "buffer" and active recovery.
- [ ] Complete the check-in with **mood < 4** → verify the insight mentions low mood encouragement.
- [ ] Complete the check-in with all metrics normal and **score ≥ 80** → verify "semaforo verde" message.
- [ ] Complete the check-in with **score 60-79** → verify "moderato" message.
- [ ] Complete the check-in with **score < 60** → verify "fatica accumulata" message.

## ⏱️ Timer Drift

- [ ] Start a workout session and trigger a rest timer (complete any set).
- [ ] Lock the device screen for **2 minutes**.
- [ ] Unlock and verify the timer shows the correct remaining time (**±1 second tolerance**).
- [ ] Verify the "rest complete" notification fires at the correct moment (if permissions granted).

## 🔊 Audio Context (iOS)

- [ ] Put the device in **Silent Mode** (mute switch on iPhone).
- [ ] Start a workout and complete a set.
- [ ] Verify the **success beep** plays despite silent mode (Web Audio API bypass).
- [ ] Verify no browser console errors related to `AudioContext`.

## 🗄️ Soft Delete Cascade

- [ ] As a **Coach**, create a Program with at least 1 week, 1 day, and 1 workout.
- [ ] Schedule the program to an athlete.
- [ ] Delete (soft-delete) the program from the Program Builder.
- [ ] Verify the athlete's **Training** page no longer shows the associated workouts.
- [ ] Verify in the database that `workouts.deleted_at` is set (not null) for all related rows.

## 📝 Feedback Dialog

- [ ] As an **Athlete**, navigate to Profile → "Segnala un Problema".
- [ ] Submit a ticket with category "Bug" and a message (≥ 10 characters).
- [ ] Verify a success toast appears: "Feedback inviato!".
- [ ] Verify the row exists in the `support_tickets` table with correct `user_id`, `category`, `message`, and `metadata` (URL, userAgent, screenSize, pwaMode).

## 🔔 Notification Permissions

- [ ] On a **fresh browser profile** (no prior permission), start a workout.
- [ ] Complete a set (triggers `unlockAudio()`).
- [ ] Verify the browser shows a **notification permission prompt**.
- [ ] Grant permission → verify rest timer notifications appear when timer ends.

## 🛡️ Safe Finish Guard

- [ ] During an active session with **0 sets completed**, hold "Finish".
- [ ] Verify the dialog warns: "Nessuna serie registrata" with a destructive-styled button.
- [ ] Cancel → verify session continues.
- [ ] During a session with **≥1 set completed**, hold "Finish".
- [ ] Verify the dialog shows "Hai completato X di Y serie".
- [ ] Confirm → verify session ends and summary page loads.

## 💳 Stripe Subscription Flow

- [ ] As a Coach, create a billing plan.
- [ ] As an Athlete, subscribe via Stripe Checkout.
- [ ] Verify `athlete_subscriptions` row is created with `status = 'active'`.
- [ ] Verify `profiles.subscription_status` is synced to `active`.
- [ ] Cancel subscription in Stripe portal → verify status transitions to `canceling`.

## 📱 Wake Lock

- [ ] Start a workout session on a **mobile device**.
- [ ] Leave the device idle for **3+ minutes** (do not touch the screen).
- [ ] Verify the screen **does not turn off** while the session is active.
- [ ] End the session → verify the screen can now auto-lock normally.

## 🔐 Auth & RLS

- [ ] Sign up as a new user → verify email verification is required.
- [ ] Attempt to access `/coach` without login → verify redirect to `/auth`.
- [ ] As an Athlete, verify you cannot see another athlete's workouts or readiness data.
- [ ] As a Coach, verify you can see data only for your assigned athletes.
