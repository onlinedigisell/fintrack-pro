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
