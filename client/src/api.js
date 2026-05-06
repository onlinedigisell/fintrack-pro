import { createClient } from '@supabase/supabase-js';

const REST_API = '/api';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseMode = Boolean(supabaseUrl && supabaseKey);
const supabase = isSupabaseMode ? createClient(supabaseUrl, supabaseKey) : null;

const tableColumns = {
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

export async function api(path, options = {}) {
  if (!isSupabaseMode) return restApi(path, options);
  const url = new URL(path, window.location.origin);
  const parts = url.pathname.split('/').filter(Boolean);
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};

  if (method === 'GET' && parts[0] === 'dashboard') return dashboard(Number(url.searchParams.get('month')), Number(url.searchParams.get('year')));
  if (method === 'GET' && parts[0] === 'reports') return reports(Number(url.searchParams.get('month')), Number(url.searchParams.get('year')));
  if (method === 'GET' && parts[0] === 'search') return searchTransactions(url.searchParams.get('q') || '');
  if (method === 'GET' && parts[0] === 'accounts' && parts[1] === 'balances') return accountBalances();
  if (method === 'GET' && parts[0] === 'loans' && parts[1] === 'summary') return loanSummary();
  if (method === 'POST' && parts[0] === 'loans' && parts[2] === 'pay') {
    return insertRow('emi_payments', { ...body, loan_id: Number(parts[1]) });
  }

  const table = parts[0];
  const id = parts[1];
  if (!tableColumns[table]) throw new Error('Invalid table');
  if (method === 'GET') return listRows(table, Object.fromEntries(url.searchParams.entries()));
  if (method === 'POST') return insertRow(table, body);
  if (method === 'PUT') return updateRow(table, id, body);
  if (method === 'DELETE') return deleteRow(table, id);
  throw new Error('Unsupported request');
}

async function restApi(path, options = {}) {
  const res = await fetch(`${REST_API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

async function listRows(table, query = {}) {
  let request = supabase.from(table).select('*').order('id', { ascending: false });
  const monthDate = table === 'emi_payments' ? 'payment_date' : 'date';
  if (query.month && query.year && ['expenses', 'investments', 'emi_payments'].includes(table)) {
    request = request.gte(monthDate, startOfMonth(query.month, query.year)).lte(monthDate, endOfMonth(query.month, query.year));
  }
  ['category', 'account_id', 'payment_app_id', 'loan_id', 'type'].forEach((key) => {
    if (query[key]) request = request.eq(key, query[key]);
  });
  const rows = await run(request);
  return hydrateRows(table, rows || []);
}

async function insertRow(table, row) {
  const clean = cleanRow(table, row);
  const rows = await run(supabase.from(table).insert(clean).select('*').single());
  return rows;
}

async function updateRow(table, id, row) {
  const clean = cleanRow(table, row);
  return run(supabase.from(table).update(clean).eq('id', id).select('*').single());
}

async function deleteRow(table, id) {
  await run(supabase.from(table).delete().eq('id', id));
  return { success: true };
}

async function run(request) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}

function cleanRow(table, row) {
  const out = {};
  tableColumns[table].forEach((key) => {
    if (row[key] !== undefined) out[key] = row[key] === '' ? null : row[key];
  });
  return out;
}

async function hydrateRows(table, rows) {
  if (!['expenses', 'loans', 'emi_payments', 'investments', 'transfers'].includes(table)) return rows;
  const [accounts, apps, loans] = await Promise.all([
    getAll('accounts'),
    getAll('payment_apps'),
    getAll('loans')
  ]);
  return rows.map((row) => ({
    ...row,
    account_name: accounts.find((a) => a.id === row.account_id)?.name,
    payment_app_name: apps.find((a) => a.id === row.payment_app_id)?.name,
    loan_name: loans.find((loan) => loan.id === row.loan_id)?.loan_name,
    from_account_name: accounts.find((a) => a.id === row.from_account_id)?.name,
    to_account_name: accounts.find((a) => a.id === row.to_account_id)?.name
  }));
}

async function getAll(table) {
  return run(supabase.from(table).select('*').order('id', { ascending: false }));
}

async function accountBalances() {
  const [accounts, expenses, emiPayments, investments, transfers] = await Promise.all([
    getAll('accounts'),
    getAll('expenses'),
    getAll('emi_payments'),
    getAll('investments'),
    getAll('transfers')
  ]);
  return accounts
    .map((account) => ({
      ...account,
      balance: Number(account.opening_balance || 0)
        - sumBy(expenses, 'amount', (row) => row.account_id === account.id)
        - sumBy(emiPayments, 'amount', (row) => row.account_id === account.id)
        - sumBy(investments, 'amount', (row) => row.account_id === account.id)
        - sumBy(transfers, 'amount', (row) => row.from_account_id === account.id)
        + sumBy(transfers, 'amount', (row) => row.to_account_id === account.id)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function dashboard(month, year) {
  const [salaries, expenses, emiPayments, investments, reminders, accounts, loans] = await Promise.all([
    getAll('salaries'),
    getAll('expenses'),
    getAll('emi_payments'),
    getAll('investments'),
    getAll('reminders'),
    accountBalances(),
    getAll('loans')
  ]);
  const inMonth = (row, key) => sameMonth(row[key], month, year);
  const salary = sumBy(salaries, 'amount', (row) => Number(row.month) === month && Number(row.year) === year);
  const expenseTotal = sumBy(expenses, 'amount', (row) => inMonth(row, 'date'));
  const emiPaid = sumBy(emiPayments, 'amount', (row) => inMonth(row, 'payment_date'));
  const investmentTotal = sumBy(investments, 'amount', (row) => inMonth(row, 'date'));
  const upcoming = reminders
    .filter((row) => !Number(row.completed) && new Date(row.due_date) >= startOfToday())
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);
  const recent = [
    ...expenses.map((row) => ({ kind: 'Expense', date: row.date, amount: row.amount, title: row.category, notes: row.notes })),
    ...investments.map((row) => ({ kind: 'Investment', date: row.date, amount: row.amount, title: row.name, notes: row.notes })),
    ...emiPayments.map((row) => ({ kind: 'EMI', date: row.payment_date, amount: row.amount, title: loans.find((loan) => loan.id === row.loan_id)?.loan_name || 'EMI', notes: row.notes }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  return { salary, expenses: expenseTotal, emiPaid, investments: investmentTotal, remaining: salary - expenseTotal - emiPaid - investmentTotal, accounts, reminders: upcoming, recent };
}

async function reports(month, year) {
  const [expenses, payments, loans, apps, dash] = await Promise.all([
    getAll('expenses'),
    getAll('emi_payments'),
    getAll('loans'),
    getAll('payment_apps'),
    dashboard(month, year)
  ]);
  const expenseRows = expenses.filter((row) => sameMonth(row.date, month, year));
  const paymentRows = payments.filter((row) => sameMonth(row.payment_date, month, year));
  return {
    byCategory: groupSum(expenseRows, (row) => row.category || 'Other'),
    byPaymentApp: groupSum(expenseRows, (row) => apps.find((app) => app.id === row.payment_app_id)?.name || 'Not set'),
    byAccount: dash.accounts.map((account) => ({ name: account.name, value: account.balance })),
    emi: groupSum(paymentRows, (row) => loans.find((loan) => loan.id === row.loan_id)?.loan_name || 'EMI'),
    salaryRemaining: dash
  };
}

async function loanSummary() {
  const [loans, payments, accounts] = await Promise.all([getAll('loans'), getAll('emi_payments'), getAll('accounts')]);
  return loans.map((loan) => {
    const loanPayments = payments.filter((payment) => payment.loan_id === loan.id);
    const totalPaid = sumBy(loanPayments, 'amount');
    const remaining = Math.max(0, Number(loan.total_amount || 0) - totalPaid);
    return {
      ...loan,
      account_name: accounts.find((account) => account.id === loan.account_id)?.name,
      total_paid: totalPaid,
      emis_paid: loanPayments.length,
      remaining_amount: remaining,
      remaining_emi_count: Number(loan.emi_amount || 0) > 0 ? Math.ceil(remaining / Number(loan.emi_amount)) : 0
    };
  });
}

async function searchTransactions(term) {
  const q = term.toLowerCase();
  const [expenses, investments, reminders] = await Promise.all([getAll('expenses'), getAll('investments'), getAll('reminders')]);
  return [
    ...expenses.map((row) => ({ kind: 'Expense', id: row.id, date: row.date, amount: row.amount, title: row.category, notes: row.notes })),
    ...investments.map((row) => ({ kind: 'Investment', id: row.id, date: row.date, amount: row.amount, title: row.name, notes: row.notes })),
    ...reminders.map((row) => ({ kind: 'Reminder', id: row.id, date: row.due_date, amount: row.amount, title: row.title, notes: row.notes }))
  ].filter((row) => `${row.title || ''} ${row.notes || ''}`.toLowerCase().includes(q)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100);
}

export async function importCsv(table, file) {
  if (!isSupabaseMode) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${REST_API}/import/${table}`, { method: 'POST', body: form });
    if (!res.ok) throw new Error((await res.json()).error || 'Import failed');
    return res.json();
  }
  const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift()).map((h) => h.trim());
  const rows = lines.map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      if (tableColumns[table]?.includes(header) && values[index] !== '') row[header] = values[index];
    });
    return cleanRow(table, row);
  }).filter((row) => Object.keys(row).length);
  if (rows.length) await run(supabase.from(table).insert(rows));
  return { imported: rows.length };
}

export async function exportCsv(table) {
  if (!isSupabaseMode) {
    window.location.href = `${REST_API}/export/${table}`;
    return;
  }
  const rows = await listRows(table);
  const headers = rows.length ? Object.keys(rows[0]) : ['id', ...tableColumns[table]];
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${table}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function groupSum(rows, getName) {
  const map = new Map();
  rows.forEach((row) => map.set(getName(row), (map.get(getName(row)) || 0) + Number(row.amount || 0)));
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function sumBy(rows, key, filter = () => true) {
  return rows.filter(filter).reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

function sameMonth(value, month, year) {
  if (!value) return false;
  const date = new Date(value);
  return date.getMonth() + 1 === Number(month) && date.getFullYear() === Number(year);
}

function startOfMonth(month, year) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function endOfMonth(month, year) {
  return new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
