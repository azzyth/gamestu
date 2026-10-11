# Game to Study Ratio

A personal academic assistant for students who game. It tracks game hours vs. study hours,
computes the game:study ratio, flags academic risk (low / moderate / high) before a bad
grade confirms it, and alerts when the trend crosses into dangerous territory.

The planning docs live in [`docs/`](docs/) (`01-PRD.md` through
`04-Feature-Prioritization.md`). This app implements their full phased roadmap:

- **Phase 1 (MVP loop):** manual logging, ratio dashboard, rules-based risk model,
  threshold escalation alerts, weekly summary, PWA install + offline log queue.
- **Phase 2:** grade outcome self-reports, ML prediction service with confidence +
  automatic fallback to the rules engine, goal setting, exam tracking and analytics,
  Google Calendar study-hour import.
- **Phase 3:** Steam playtime import, one-at-a-time personalized recommendations,
  parent/advisor read-only share links (student-controlled, revocable), weekly
  model retraining with AUC-gated promotion.

## Stack

Next.js 15 (App Router, TypeScript) + Tailwind CSS v4 + Supabase (Postgres, auth, RLS)
+ Recharts + Web Push (web-push) + Resend (email) + FastAPI/scikit-learn for the ML service.

## Setup

1. **Create a Supabase project** at supabase.com, then run the SQL in
   `supabase/migrations/` (001, then 002, then 003) in the SQL editor.
2. **Configure environment.** Copy `.env.example` to `.env.local` and fill in at
   minimum the Supabase URL and anon key:
   ```
   cp .env.example .env.local
   ```
3. **Install and run:**
   ```
   npm install
   npm run dev
   ```
4. **Seed a demo account** (optional, needs `SUPABASE_SERVICE_ROLE_KEY`):
   ```
   npm run seed
   ```
   Then log in as `demo@gamestu.app` / `Demo1234!` — the seeded history ends with a
   week of climbing ratio, so logging one more day triggers the escalation alert.

## Tests

```
npm test
```

Unit tests cover the ratio math and every rules-engine branch (low / moderate / high,
escalation logic, edge cases like zero study time).

## Optional pieces

- **Push alerts:** `npx web-push generate-vapid-keys`, put the keys in
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, then use Settings > Enable push.
- **Weekly summary emails:** set `RESEND_API_KEY` (and a verified `SUMMARY_EMAIL_FROM`).
- **ML service:** `cd ml-service && pip install -r requirements.txt`, then
  `python train_seed.py --serve` to train on synthetic data and boot the API on :8001.
  Point `ML_SERVICE_URL=http://127.0.0.1:8001` at it. The app automatically falls back
  to the rules engine whenever the service is down or its confidence is under 0.55
  (low-confidence output renders as a "trend watch" instead of a hard risk level).
- **Steam import:** set `STEAM_API_KEY`, then Settings > Steam with your SteamID64.
- **Google Calendar import:** set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  (redirect URI: `<origin>/api/integrations/google/callback`), then Settings > Connect.

## Crons (Vercel)

`vercel.json` schedules three jobs, all authenticated with `Authorization: Bearer $CRON_SECRET`:

| Path | Schedule | Job |
|---|---|---|
| `/api/cron/sync` | daily 07:00 | Steam + Google Calendar sync for connected users |
| `/api/cron/weekly-summary` | Sun 09:00 | Compute + store + email last week's recap |
| `/api/cron/retrain` | Mon 04:30 | Send cohort features + outcomes to the ML service |

`SUPABASE_SERVICE_ROLE_KEY` must be set in the deployed environment for these to run.

## Layout

```
src/
  app/
    (app)/            dashboard, log, analytics, goals, outcomes, settings
    api/              logs, goals, outcomes, exams, share, integrations, crons
    share/[token]/    public read-only parent/advisor view
    login, signup     auth screens
  components/         LogForm, RatioChart, RiskBadge, AnalyticsCharts, ...
  lib/
    ratio.ts          ratio + trend math (shared by everything)
    risk-model.ts     rules engine (thresholds, escalation)
    predict.ts        ML client with rules fallback
    alerts.ts         log -> predict -> snapshot -> alert pipeline
    integrations/     steam.ts, google.ts
supabase/migrations/  001-003 (tables + RLS + triggers)
ml-service/           FastAPI /predict + /train with model registry
scripts/seed.ts       demo account + 28 days of logs
```
