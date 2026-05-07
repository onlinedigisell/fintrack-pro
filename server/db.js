import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'fintrack.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export const tables = {
  salaries: ['month', 'year', 'amount', 'notes'],
  accounts: ['name', 'type', 'opening_balance', 'notes'],
  expenses: ['date', 'amount', 'category', 'notes', 'payment_method', 'payment_app_id', 'account_id'],
  loans: ['loan_name', 'loan_type', 'total_amount', 'emi_amount', 'start_date', 'end_date', 'interest_rate', 'lender', 'account_id', 'due_day', 'notes'],
  emi_payments: ['loan_id', 'payment_date', 'amount', 'account_id', 'notes'],
  investments: ['name', 'type', 'amount', 'date', 'account_id', 'notes'],
  payment_apps: ['name', 'type', 'notes'],
  reminders: ['title', 'amount', 'due_date', 'repeat_monthly', 'notes', 'completed'],
  transfers: ['from_account_id', 'to_account_id', 'amount', 'date', 'notes']
};

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS salaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 0),
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  opening_balance REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Other',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 0),
  category TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT NOT NULL,
  payment_app_id INTEGER REFERENCES payment_apps(id) ON DELETE SET NULL,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_name TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  total_amount REAL NOT NULL CHECK(total_amount >= 0),
  emi_amount REAL NOT NULL CHECK(emi_amount >= 0),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  interest_rate REAL,
  lender TEXT,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  due_day INTEGER DEFAULT 5 CHECK(due_day BETWEEN 1 AND 31),
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS emi_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_date TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 0),
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 0),
  date TEXT NOT NULL,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  amount REAL DEFAULT 0,
  due_date TEXT NOT NULL,
  repeat_monthly INTEGER DEFAULT 0,
  notes TEXT,
  completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  amount REAL NOT NULL CHECK(amount >= 0),
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`;

db.exec(schema);

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM accounts').get().count;
  if (count) return;

  db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run('FinTrack User', 'user@example.com');
  const accountInsert = db.prepare('INSERT INTO accounts (name, type, opening_balance, notes) VALUES (?, ?, ?, ?)');
  const hdfc = accountInsert.run('HDFC Salary Account', 'Bank account', 85000, 'Primary salary account').lastInsertRowid;
  const cash = accountInsert.run('Cash Wallet', 'Cash', 4500, '').lastInsertRowid;
  const upi = accountInsert.run('UPI Wallet', 'UPI wallet', 12000, '').lastInsertRowid;
  const credit = accountInsert.run('Axis Credit Card', 'Credit card', 0, 'Monthly bill payment').lastInsertRowid;

  const appInsert = db.prepare('INSERT INTO payment_apps (name, type, notes) VALUES (?, ?, ?)');
  const gpay = appInsert.run('Google Pay', 'UPI', '').lastInsertRowid;
  const phonepe = appInsert.run('PhonePe', 'UPI', '').lastInsertRowid;
  const cardApp = appInsert.run('Credit Card App', 'Card', '').lastInsertRowid;

  db.prepare('INSERT INTO salaries (month, year, amount, notes) VALUES (?, ?, ?, ?)').run(5, 2026, 120000, 'Sample May salary');
  const expenseInsert = db.prepare('INSERT INTO expenses (date, amount, category, notes, payment_method, payment_app_id, account_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
  expenseInsert.run('2026-05-01', 18000, 'Rent', 'Monthly rent', 'UPI', gpay, hdfc);
  expenseInsert.run('2026-05-02', 850, 'Food', 'Groceries', 'UPI', phonepe, upi);
  expenseInsert.run('2026-05-03', 2200, 'Travel', 'Fuel', 'Card', cardApp, credit);
  expenseInsert.run('2026-05-04', 1400, 'Bills', 'Internet bill', 'UPI', gpay, hdfc);

  const loan = db.prepare('INSERT INTO loans (loan_name, loan_type, total_amount, emi_amount, start_date, end_date, interest_rate, lender, account_id, due_day, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run('Home Loan', 'Home', 2500000, 32000, '2024-01-05', '2034-01-05', 8.5, 'SBI', hdfc, 5, 'Sample loan').lastInsertRowid;
  db.prepare('INSERT INTO emi_payments (loan_id, payment_date, amount, account_id, notes) VALUES (?, ?, ?, ?, ?)').run(loan, '2026-05-05', 32000, hdfc, 'May EMI');

  db.prepare('INSERT INTO investments (name, type, amount, date, account_id, notes) VALUES (?, ?, ?, ?, ?, ?)').run('Nifty 50 SIP', 'SIP', 10000, '2026-05-06', hdfc, 'Monthly SIP');
  db.prepare('INSERT INTO reminders (title, amount, due_date, repeat_monthly, notes, completed) VALUES (?, ?, ?, ?, ?, ?)').run('Credit card bill', 12000, '2026-05-18', 1, 'Pay before due date', 0);
  db.prepare('INSERT INTO transfers (from_account_id, to_account_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)').run(hdfc, cash, 5000, '2026-05-02', 'ATM withdrawal');
}

seed();

export function list(table, query = {}) {
  if (!tables[table]) throw new Error('Invalid table');
  const where = [];
  const params = {};

  if (query.month && ['expenses', 'investments'].includes(table)) {
    where.push("strftime('%m', date) = @month");
    params.month = String(query.month).padStart(2, '0');
  }
  if (query.year && ['expenses', 'investments'].includes(table)) {
    where.push("strftime('%Y', date) = @year");
    params.year = String(query.year);
  }
  if (query.month && table === 'emi_payments') {
    where.push("strftime('%m', payment_date) = @month");
    params.month = String(query.month).padStart(2, '0');
  }
  if (query.year && table === 'emi_payments') {
    where.push("strftime('%Y', payment_date) = @year");
    params.year = String(query.year);
  }
  ['category', 'account_id', 'payment_app_id', 'loan_id', 'type'].forEach((key) => {
    if (query[key]) {
      where.push(`${key} = @${key}`);
      params[key] = query[key];
    }
  });

  const joins = {
    expenses: 'SELECT expenses.*, accounts.name AS account_name, payment_apps.name AS payment_app_name FROM expenses LEFT JOIN accounts ON accounts.id = expenses.account_id LEFT JOIN payment_apps ON payment_apps.id = expenses.payment_app_id',
    loans: 'SELECT loans.*, accounts.name AS account_name FROM loans LEFT JOIN accounts ON accounts.id = loans.account_id',
    emi_payments: 'SELECT emi_payments.*, loans.loan_name, accounts.name AS account_name FROM emi_payments LEFT JOIN loans ON loans.id = emi_payments.loan_id LEFT JOIN accounts ON accounts.id = emi_payments.account_id',
    investments: 'SELECT investments.*, accounts.name AS account_name FROM investments LEFT JOIN accounts ON accounts.id = investments.account_id',
    transfers: 'SELECT transfers.*, fa.name AS from_account_name, ta.name AS to_account_name FROM transfers LEFT JOIN accounts fa ON fa.id = transfers.from_account_id LEFT JOIN accounts ta ON ta.id = transfers.to_account_id'
  };
  const sql = `${joins[table] || `SELECT * FROM ${table}`} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC`;
  return db.prepare(sql).all(params);
}

export function create(table, body) {
  const columns = tables[table];
  if (!columns) throw new Error('Invalid table');
  const values = columns.filter((column) => body[column] !== undefined);
  const sql = `INSERT INTO ${table} (${values.join(',')}) VALUES (${values.map((v) => `@${v}`).join(',')})`;
  const result = db.prepare(sql).run(body);
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
}

export function update(table, id, body) {
  const columns = tables[table];
  if (!columns) throw new Error('Invalid table');
  const values = columns.filter((column) => body[column] !== undefined);
  if (!values.length) return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  db.prepare(`UPDATE ${table} SET ${values.map((v) => `${v} = @${v}`).join(', ')} WHERE id = @id`).run({ ...body, id });
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

export function remove(table, id) {
  if (!tables[table]) throw new Error('Invalid table');
  return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

export function accountBalances() {
  return db.prepare(`
    SELECT a.*,
      a.opening_balance
      - COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.account_id = a.id), 0)
      - COALESCE((SELECT SUM(amount) FROM emi_payments ep WHERE ep.account_id = a.id), 0)
      - COALESCE((SELECT SUM(amount) FROM investments i WHERE i.account_id = a.id), 0)
      - COALESCE((SELECT SUM(amount) FROM transfers t WHERE t.from_account_id = a.id), 0)
      + COALESCE((SELECT SUM(amount) FROM transfers t WHERE t.to_account_id = a.id), 0)
      AS balance
    FROM accounts a
    ORDER BY a.name
  `).all();
}

export function dashboard(month, year) {
  const monthText = String(month).padStart(2, '0');
  const y = String(year);
  const salary = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM salaries WHERE month = ? AND year = ?').get(month, year).total;
  const expenses = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE strftime('%m', date)=? AND strftime('%Y', date)=?").get(monthText, y).total;
  const emiPaid = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM emi_payments WHERE strftime('%m', payment_date)=? AND strftime('%Y', payment_date)=?").get(monthText, y).total;
  const investments = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM investments WHERE strftime('%m', date)=? AND strftime('%Y', date)=?").get(monthText, y).total;
  const reminders = db.prepare("SELECT * FROM reminders WHERE completed = 0 AND date(due_date) >= date('now') ORDER BY date(due_date) LIMIT 6").all();
  const loans = list('loans');
  const emiPayments = list('emi_payments');
  const emiReminders = upcomingEmiReminders(loans, emiPayments);
  const recent = db.prepare(`
    SELECT 'Expense' AS kind, date, amount, category AS title, notes FROM expenses
    UNION ALL SELECT 'Investment', date, amount, name, notes FROM investments
    UNION ALL SELECT 'EMI', payment_date, amount, loan_name, emi_payments.notes FROM emi_payments JOIN loans ON loans.id = emi_payments.loan_id
    ORDER BY date DESC LIMIT 10
  `).all();
  return { salary, expenses, emiPaid, investments, remaining: salary - expenses - emiPaid - investments, accounts: accountBalances(), reminders, emiReminders, recent };
}

export function reports(month, year) {
  const monthText = String(month).padStart(2, '0');
  const y = String(year);
  return {
    byCategory: db.prepare("SELECT category AS name, SUM(amount) AS value FROM expenses WHERE strftime('%m', date)=? AND strftime('%Y', date)=? GROUP BY category ORDER BY value DESC").all(monthText, y),
    byPaymentApp: db.prepare("SELECT COALESCE(payment_apps.name, 'Not set') AS name, SUM(expenses.amount) AS value FROM expenses LEFT JOIN payment_apps ON payment_apps.id = expenses.payment_app_id WHERE strftime('%m', date)=? AND strftime('%Y', date)=? GROUP BY payment_apps.name ORDER BY value DESC").all(monthText, y),
    byAccount: accountBalances().map((account) => ({ name: account.name, value: account.balance })),
    emi: db.prepare("SELECT loans.loan_name AS name, SUM(emi_payments.amount) AS value FROM emi_payments JOIN loans ON loans.id = emi_payments.loan_id WHERE strftime('%m', payment_date)=? AND strftime('%Y', payment_date)=? GROUP BY loans.loan_name ORDER BY value DESC").all(monthText, y),
    salaryRemaining: dashboard(month, year)
  };
}

export function loanSummary() {
  const rows = db.prepare(`
    SELECT loans.*,
      accounts.name AS account_name,
      COALESCE(SUM(emi_payments.amount), 0) AS total_paid,
      COUNT(emi_payments.id) AS emis_paid,
      MAX(0, loans.total_amount - COALESCE(SUM(emi_payments.amount), 0)) AS remaining_amount
    FROM loans
    LEFT JOIN accounts ON accounts.id = loans.account_id
    LEFT JOIN emi_payments ON emi_payments.loan_id = loans.id
    GROUP BY loans.id
    ORDER BY loans.id DESC
  `).all();
  return rows.map((loan) => ({
    ...loan,
    remaining_emi_count: loan.emi_amount > 0 ? Math.ceil(loan.remaining_amount / loan.emi_amount) : 0
  }));
}

export function searchTransactions(term) {
  const q = `%${term || ''}%`;
  return db.prepare(`
    SELECT 'Expense' AS kind, id, date, amount, category AS title, notes FROM expenses WHERE category LIKE ? OR notes LIKE ?
    UNION ALL SELECT 'Investment', id, date, amount, name, notes FROM investments WHERE name LIKE ? OR notes LIKE ?
    UNION ALL SELECT 'Reminder', id, due_date, amount, title, notes FROM reminders WHERE title LIKE ? OR notes LIKE ?
    ORDER BY date DESC LIMIT 100
  `).all(q, q, q, q, q, q);
}

function upcomingEmiReminders(loans, payments) {
  const today = startOfToday();
  const until = new Date(today);
  until.setDate(until.getDate() + 45);
  return loans
    .map((loan) => {
      const dueDate = nextUnpaidEmiDate(loan, payments, today, until);
      if (!dueDate) return null;
      return {
        id: `emi-${loan.id}-${dueDate}`,
        type: 'emi',
        loan_id: loan.id,
        loan_name: loan.loan_name,
        lender: loan.lender,
        amount: loan.emi_amount,
        due_date: dueDate,
        due_day: loan.due_day,
        account_id: loan.account_id,
        account_name: loan.account_name,
        notes: `Auto EMI deduction day ${loan.due_day || 1}`
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 8);
}

function nextUnpaidEmiDate(loan, payments, today, until) {
  if (!loan.start_date || !loan.end_date) return null;
  const start = new Date(loan.start_date);
  const end = new Date(loan.end_date);
  let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
  if (cursor < new Date(start.getFullYear(), start.getMonth(), 1)) {
    cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  }
  for (let index = 0; index < 18; index += 1) {
    const due = dateForDay(cursor.getFullYear(), cursor.getMonth(), loan.due_day || start.getDate());
    if (due >= start && due <= end && due >= today && due <= until && !emiPaidForMonth(payments, loan.id, due)) {
      return toIsoDate(due);
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return null;
}

function dateForDay(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(Number(day || 1), lastDay));
}

function emiPaidForMonth(payments, loanId, due) {
  return payments.some((payment) => Number(payment.loan_id) === Number(loanId)
    && new Date(payment.payment_date).getMonth() === due.getMonth()
    && new Date(payment.payment_date).getFullYear() === due.getFullYear());
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
