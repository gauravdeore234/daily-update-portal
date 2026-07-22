# Daily Update Portal

A mobile-friendly website where Testers, PMs, and Developers submit their daily
status updates. Project Managers get a single, collated, WhatsApp-ready message
to paste into the group. Hostable on Vercel.

## Features

- **Structured form** — Role dropdown → searchable Name field (search-as-you-type,
  filtered by role) → large Daily Update box with bullets and newlines. A
  read-only Date & Day field is shown from the server.
- **Server-authoritative 10:00 PM IST cutoff** — the cutoff and "today" are
  decided on the server in `Asia/Kolkata`. Changing your device clock cannot
  reopen submissions.
- **Overwrite on re-submit** — submitting again under your name replaces your
  earlier update for the day (DB-enforced, safe under concurrent edits).
- **Today's Updates tab** — live board of everyone's updates plus a collated
  WhatsApp message with a **Copy all** button. Visible to everyone.
- **Manage Team** — admin-password-gated: add teams, add/rename/remove members.
- **10:15 PM IST archive email** — Vercel Cron sends the day's collated updates
  via Resend for record-keeping.
- **Daily reset** — reads are scoped to the current IST day, so the board is a
  clean slate after midnight while history is retained.

## Setup

1. **Create a Supabase project.** In the SQL editor, run
   `supabase/migrations/0001_init.sql` (creates tables and seeds the current
   roster).
2. **Copy env vars.** `cp .env.example .env.local` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (from Supabase → Project
     Settings → API). The service-role key is used only in server routes.
   - `ADMIN_PASSWORD` — gate for the Manage Team tab.
   - `RESEND_API_KEY`, `ARCHIVE_EMAIL_FROM` (a verified sender), `ARCHIVE_EMAIL_TO`.
   - `CRON_SECRET` — any long random string.
3. **Install & run.**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a Git repo and import it into Vercel.
2. Add all env vars from `.env.example` in the Vercel project settings.
   (Vercel auto-injects `CRON_SECRET` as the Bearer token on cron calls.)
3. `vercel.json` schedules the archive at `45 16 * * *` UTC = **22:15 IST**.

## Testing the cron/archive locally

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/archive
```

## Notes

- Submitting updates is open (no login) — anyone with the link picks their name.
- The cutoff, admin check, and cron secret are all enforced server-side.
