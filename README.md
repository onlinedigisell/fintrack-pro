# FinTrack Pro

FinTrack Pro is a full-stack personal finance tracker for salary, expenses, EMIs, accounts, investments, payment apps, reminders, reports, CSV import/export, and mobile-friendly browser use.

## Tech Stack

- React + Vite frontend
- Tailwind CSS responsive UI
- Node.js + Express backend
- SQLite local database using `better-sqlite3`
- Recharts for reports

## Project Structure

```text
fintrack-pro/
  client/
    src/
      main.jsx
      styles.css
    index.html
    vite.config.js
    tailwind.config.js
    postcss.config.js
  server/
    data/
      fintrack.db       created automatically
    db.js
    index.js
  package.json
  README.md
```

## Install

Use Node.js 24 or newer. The backend uses Node's built-in SQLite support, so no native SQLite package compilation is required.

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

The API runs at:

```text
http://localhost:4000
```

For mobile browser testing on the same Wi-Fi network, run `npm run dev`, find your computer's local IP address, then open:

```text
http://YOUR_LOCAL_IP:5173
```

## Production Build

```bash
npm run build
npm start
```

The Express server serves the built frontend from `dist`.

## Host Online With GitHub + Render

GitHub stores the code. Render runs the full Node.js backend and SQLite database.

1. Create a new empty GitHub repository named `fintrack-pro`.
2. Upload or push this project folder to that repository.
3. Go to [Render](https://render.com), choose **New Web Service**, and connect the GitHub repository.
4. Use these settings:

```text
Build Command: npm install && npm run build
Start Command: npm start
Node Version: 24
```

5. Add environment variable:

```text
DATA_DIR=/var/data
```

6. Add a persistent disk:

```text
Mount Path: /var/data
Size: 1 GB
```

The included `render.yaml` already contains these settings for Render Blueprint deployment.

Important: GitHub Pages is not enough for this app because FinTrack Pro has an Express API and SQLite database. Use Render, Railway, Fly.io, or another Node backend host.

## Free Hosting With Vercel + Supabase

This is the recommended free path when you do not want to add a card for Render.

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com).
2. Create a free project.
3. Open **SQL Editor**.
4. Copy everything from `supabase/complete-setup.sql`.
5. Run it once.

This creates all FinTrack Pro tables, login profiles, admin approval rules, and Row Level Security policies.

Use this single setup file for new Supabase projects:

```text
supabase/complete-setup.sql
```

If you already ran the old schema before authentication was added, also run:

```text
supabase/auth-security.sql
```

That adds `user_id` columns and Row Level Security policies.

For admin-controlled access, run this file too:

```text
supabase/admin-access.sql
```

The first user who signs up becomes `admin` automatically. Every later user is `pending` until the admin approves them in the app's **Users** page.

### 1A. Supabase Auth Settings

Open:

```text
Authentication -> Providers -> Email
```

For easiest first setup, use:

```text
Enable Email provider: ON
Confirm email: OFF
```

If you keep email confirmation ON, new users must confirm their email before signing in.

### 2. Get Supabase Keys

In Supabase, open:

```text
Project Settings -> API
```

Copy:

```text
Project URL
anon public key
```

### 3. Add Vercel Environment Variables

In Vercel project settings, add:

```text
VITE_SUPABASE_URL=your Supabase Project URL
VITE_SUPABASE_ANON_KEY=your Supabase anon public key
```

### 4. Deploy on Vercel

1. Go to [Vercel](https://vercel.com).
2. Import the GitHub repository.
3. Framework should be Vite.
4. Build command:

```bash
npm run build
```

5. Output directory:

```text
dist
```

6. Deploy.

When the two `VITE_SUPABASE_*` variables are present, the frontend uses Supabase directly. Without those variables, local development still uses the Express + SQLite backend.

Online Supabase mode includes a login screen. Each signed-in user's finance records are isolated by Supabase Row Level Security.

Admin access flow:

- First signup: admin and approved automatically
- Later signups: pending
- Admin can approve, block, or promote users from **Users**
- Pending or blocked users cannot access finance records

### Local Supabase Mode

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Fill in the values, then run:

```bash
npm run client
```

## Included Features

- Dashboard with monthly salary, expenses, EMI paid, remaining balance, total investments, account balances, upcoming reminders, and recent transactions
- Salary management by month and year with edit support
- Daily expenses with date, amount, category, notes, payment method, payment app, account, filters, edit, and delete
- EMI and loan tracker with loan details, paid EMI count, total paid, remaining amount, remaining EMI count, manual old EMI payments, and mark paid
- Accounts with bank, cash, UPI wallet, credit card, computed balances, and transfers
- Investments with monthly and yearly-ready records
- Payment apps with app-wise report
- Reminders with monthly repeat flag, completion state, and browser notification support
- Reports with monthly expense, category, EMI, account, payment app, and salary remaining charts
- Search transactions
- CSV export and CSV import for all major tables
- Sample data seeded automatically on the first run

## Database Tables

- `users`
- `salaries`
- `accounts`
- `expenses`
- `loans`
- `emi_payments`
- `investments`
- `payment_apps`
- `reminders`
- `transfers`

## Notes

- Currency is displayed in Indian rupees.
- Dates are displayed using Indian locale formatting.
- Old expenses, old investments, old transfers, and old EMI payments can be added by choosing past dates in the forms.
- SQLite data is stored in `server/data/fintrack.db`.
