# Budgetly

A calm, paper-inspired budgeting app. Built with Next.js and Supabase, ready to deploy on Vercel.

## Features

- **Calendar view** — day, week, and month modes showing every entry on the day it happened.
- **Quick add** — fast capture of expenses and income with categories.
- **Recurring schedule** — track paydays alongside bills and subscriptions, with a 30-day forecast of money in vs. out.
- **Analytics** — daily flow, category breakdown, and a running net line over the last 30 days.
- **Receipt scanner** — photo capture and upload UI ready to go; OCR is stubbed for you to wire up later.
- **Auth + multi-device** — Supabase email/password auth with row-level security so each user only sees their own data.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), make a new project (free tier is fine), then:

1. Open **SQL Editor** and paste the contents of `supabase-schema.sql`. Run it. This creates the `transactions` and `recurring` tables with row-level security enabled.
2. Open **Project Settings → API** and grab your **Project URL** and **anon public** key.

### 3. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start logging.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), click **New Project**, and import your repo.
3. In the Vercel project settings, add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

That's it. Vercel auto-detects Next.js and handles the build.

## Adding receipt OCR later

`components/ReceiptScanner.js` already handles photo capture and upload UI. To plug in extraction:

1. Pick a service — Google Cloud Vision, AWS Textract, Mindee, Veryfi, or an LLM with vision.
2. Add a server route at `app/api/receipt-scan/route.js` that accepts the image and calls the OCR provider.
3. In `ReceiptScanner.js`, after `handleFile` runs, POST the file to that route and pre-fill `amount`, `merchant`, and `date` from the response.

The form below the preview is already wired to save into the same `transactions` table.

## Project structure

```
app/
  layout.js          root layout
  page.js            auth gate + dashboard mount
  globals.css        global styles, fonts, grain
components/
  AuthScreen.js      sign in / sign up
  Dashboard.js       tab shell, header, monthly summary
  CalendarView.js    day / week / month calendar
  QuickAdd.js        new transaction form
  RecurringView.js   recurring income & expenses + 30-day forecast
  Analytics.js       charts (recharts)
  ReceiptScanner.js  photo capture + manual entry (OCR-ready)
lib/
  supabase.js        client
supabase-schema.sql  database setup
```

## Design notes

The aesthetic is a deliberate move away from the usual fintech-purple-gradient look. It pulls from old paper ledgers — Fraunces for italic display type, JetBrains Mono for utility labels, and a warm cream/ink/rust/moss palette over a soft paper background with a subtle grain. Every chart, button, and panel sits on a low-contrast grid so the numbers themselves do the talking.
