import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { accountBalances, create, dashboard, db, list, loanSummary, remove, reports, searchTransactions, tables, update } from './db.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const ok = (handler) => (req, res) => {
  try {
    res.json(handler(req, res));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

Object.keys(tables).forEach((table) => {
  app.get(`/api/${table}`, ok((req) => list(table, req.query)));
  app.post(`/api/${table}`, ok((req) => create(table, req.body)));
  app.put(`/api/${table}/:id`, ok((req) => update(table, req.params.id, req.body)));
  app.delete(`/api/${table}/:id`, ok((req) => {
    remove(table, req.params.id);
    return { success: true };
  }));
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'FinTrack Pro' }));
app.get('/api/accounts/balances/all', ok(() => accountBalances()));
app.get('/api/loans/summary/all', ok(() => loanSummary()));
app.get('/api/dashboard', ok((req) => dashboard(Number(req.query.month), Number(req.query.year))));
app.get('/api/reports', ok((req) => reports(Number(req.query.month), Number(req.query.year))));
app.get('/api/search', ok((req) => searchTransactions(req.query.q)));

app.post('/api/loans/:id/pay', ok((req) => create('emi_payments', {
  loan_id: Number(req.params.id),
  payment_date: req.body.payment_date,
  amount: req.body.amount,
  account_id: req.body.account_id,
  notes: req.body.notes || 'Manual EMI payment'
})));

app.get('/api/export/:table', ok((req, res) => {
  const table = req.params.table;
  if (!tables[table]) throw new Error('Invalid table');
  const rows = list(table, req.query);
  const headers = rows.length ? Object.keys(rows[0]) : ['id', ...tables[table]];
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
  res.send(csv);
}));

app.post('/api/import/:table', upload.single('file'), ok((req) => {
  const table = req.params.table;
  if (!tables[table]) throw new Error('Invalid table');
  if (!req.file) throw new Error('CSV file is required');
  const lines = req.file.buffer.toString('utf8').split(/\r?\n/).filter(Boolean);
  const parseCsvLine = (line) => {
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
  };
  const headers = parseCsvLine(lines.shift()).map((h) => h.trim());
  let imported = 0;
  for (const line of lines) {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      if (tables[table].includes(header) && values[index] !== '') row[header] = values[index];
    });
    if (Object.keys(row).length) {
      create(table, row);
      imported += 1;
    }
  }
  return { imported };
}));

app.use(express.static(distDir));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FinTrack Pro API running on http://localhost:${PORT}`);
});
