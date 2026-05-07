import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bell, CreditCard, Download, Home, IndianRupee, Landmark, LineChart, PiggyBank, Plus, RefreshCcw, Search, Settings, ShieldCheck, Smartphone, Trash2, WalletCards } from 'lucide-react';
import { api, exportCsv, getMyProfile, importCsv, isSupabaseMode, listProfiles, supabase, supabaseConfigError, updateProfile } from './api';
import { ErrorBoundary } from './ErrorBoundary';
import './styles.css';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateIn = (value) => value ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '-';
const today = new Date();
const defaultMonth = today.getMonth() + 1;
const defaultYear = today.getFullYear();
const categories = ['Food', 'Travel', 'Rent', 'Bills', 'Shopping', 'Medical', 'Other'];
const investmentTypes = ['SIP', 'Mutual Fund', 'FD', 'Gold', 'Stocks', 'Insurance', 'Other'];
const accountTypes = ['Bank account', 'Cash', 'UPI wallet', 'Credit card'];
const appTypes = ['Google Pay', 'PhonePe', 'Paytm', 'Credit Card App', 'Bank App', 'Other'];
const colors = ['#0f9f86', '#e35d43', '#d89b16', '#2563eb', '#7c3aed', '#0891b2'];

function useData(path, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => {
    setLoading(true);
    setError('');
    api(path).then(setData).catch((err) => {
      setError(err.message || 'Unable to load data');
      setData([]);
    }).finally(() => setLoading(false));
  };
  useEffect(load, deps);
  return { data, loading, error, load };
}

function Shell({ profile }) {
  const [page, setPage] = useState('Dashboard');
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const nav = [
    ['Dashboard', Home], ['Salary', IndianRupee], ['Expenses', CreditCard], ['EMI / Loans', Landmark],
    ['Accounts', WalletCards], ['Investments', PiggyBank], ['Payment Apps', Smartphone], ['Reminders', Bell],
    ['Reports', LineChart], ['Settings', Settings]
  ];
  if (profile?.role === 'admin') nav.push(['Users', ShieldCheck]);
  return (
    <div className="min-h-screen bg-[#111] text-ink">
      <div className="mx-auto min-h-screen max-w-[1500px] bg-paper md:rounded-none">
      <aside className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 shadow-[0_-16px_35px_rgba(0,0,0,0.08)] backdrop-blur md:top-6 md:bottom-6 md:left-6 md:right-auto md:h-auto md:w-72 md:rounded-[2rem] md:border md:border-stone-100 md:shadow-phone">
        <div className="hidden px-6 py-6 md:block">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-coral text-white shadow-soft"><IndianRupee size={22} /></div>
            <div><h1 className="text-xl font-bold">FinTrack Pro</h1><p className="text-xs text-coral">easy money manager</p></div>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 py-2 md:block md:px-3">
          {nav.map(([name, Icon]) => (
            <button key={name} onClick={() => setPage(name)} title={name} className={`nav-btn ${page === name ? 'bg-coral text-white shadow-soft' : 'text-stone-500 hover:bg-blush hover:text-coral'}`}>
              <Icon size={18} /><span>{name}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="pb-24 md:ml-80 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-paper/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-coral">Money Manager</p>
              <h2 className="text-2xl font-bold tracking-tight">{page}</h2>
              {isSupabaseMode && <p className="mt-1 text-xs font-semibold text-mint">Online database connected {profile?.role === 'admin' ? '- Admin' : ''}</p>}
            </div>
            <div className="flex gap-2">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input w-28">{Array.from({ length: 12 }, (_, i) => <option value={i + 1} key={i}>{new Date(2026, i).toLocaleString('en-IN', { month: 'short' })}</option>)}</select>
              <input value={year} onChange={(e) => setYear(Number(e.target.value))} type="number" className="input w-24" />
              {isSupabaseMode && <button className="icon-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>}
            </div>
          </div>
        </header>
        <section className="px-4 py-6 md:px-8">
          {page === 'Dashboard' && <Dashboard month={month} year={year} />}
          {page === 'Salary' && <Salary month={month} year={year} />}
          {page === 'Expenses' && <Expenses month={month} year={year} />}
          {page === 'EMI / Loans' && <Loans />}
          {page === 'Accounts' && <Accounts />}
          {page === 'Investments' && <Investments month={month} year={year} />}
          {page === 'Payment Apps' && <PaymentApps month={month} year={year} />}
          {page === 'Reminders' && <Reminders />}
          {page === 'Reports' && <Reports month={month} year={year} />}
          {page === 'Settings' && <SettingsPage />}
          {page === 'Users' && profile?.role === 'admin' && <UsersAdmin />}
        </section>
      </main>
      </div>
    </div>
  );
}

function AuthGate() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseMode);
  const [error, setError] = useState('');
  async function loadProfile(nextSession) {
    setSession(nextSession);
    setError('');
    if (!nextSession) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setProfile(await getMyProfile());
    } catch (err) {
      setError(err.message || 'Unable to load account profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!isSupabaseMode) return;
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => loadProfile(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  if (supabaseConfigError) return <SetupError message={supabaseConfigError} />;
  if (!isSupabaseMode) return <Shell />;
  if (loading) return <div className="grid min-h-screen place-items-center bg-paper text-ink">Loading FinTrack Pro...</div>;
  if (error) return <AccessMessage title="Setup needs attention" message={error} detail="Run supabase/complete-setup.sql in your Supabase SQL Editor, then refresh this page." />;
  if (!session) return <LoginScreen />;
  if (profile?.status === 'pending') return <AccessMessage title="Waiting for admin approval" message="Your account is created, but the admin must approve it before you can use FinTrack Pro." />;
  if (profile?.status === 'blocked') return <AccessMessage title="Access blocked" message="Your account access is blocked. Contact the FinTrack Pro admin." />;
  if (profile?.status !== 'approved') return <AccessMessage title="Access not active" message="Your account is not approved yet." />;
  return <Shell profile={profile} />;
}

function SetupError({ message }) {
  return <div className="grid min-h-screen place-items-center bg-[#111] px-4">
    <section className="w-full max-w-lg rounded-[2rem] bg-white p-6 text-center shadow-phone">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-coral text-white"><Settings size={26} /></div>
      <h1 className="text-2xl font-bold">Fix Vercel Supabase settings</h1>
      <p className="mt-3 rounded-2xl bg-blush px-4 py-3 text-sm text-coral">{message}</p>
      <div className="mt-4 text-left text-sm text-stone-600">
        <p className="font-semibold text-ink">Required Vercel values:</p>
        <p className="mt-2">VITE_SUPABASE_URL = https://ligmgikrldjjlyjhxlqw.supabase.co</p>
        <p className="mt-1">VITE_SUPABASE_ANON_KEY = your Supabase anon public key</p>
      </div>
    </section>
  </div>;
}

function AccessMessage({ title, message, detail }) {
  return <div className="grid min-h-screen place-items-center bg-[#111] px-4">
    <section className="w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-phone">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-coral text-white"><ShieldCheck size={26} /></div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-stone-600">{message}</p>
      {detail && <p className="mt-3 rounded-2xl bg-blush px-4 py-3 text-sm text-coral">{detail}</p>}
      <button className="btn mt-5 w-full" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </section>
  </div>;
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  async function submit(mode) {
    setMessage('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setMessage('Enter both email and password.');
      return;
    }
    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('anonymous sign-ins are disabled')) {
        setMessage('Enable Email sign-in and Allow new users to sign up in Supabase Authentication settings.');
      } else if (lower.includes('email signups are disabled')) {
        setMessage('Supabase email signups are disabled. Turn on Email provider and allow signup.');
      } else {
        setMessage(error.message);
      }
    }
    else setMessage(mode === 'signup' ? 'Account created. If email confirmation is enabled, check your inbox.' : 'Signing in...');
  }
  return <div className="grid min-h-screen place-items-center bg-[#111] px-4">
    <section className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-phone">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-coral text-white"><IndianRupee size={24} /></div>
        <div><h1 className="text-2xl font-bold">FinTrack Pro</h1><p className="text-sm text-coral">secure online finance tracker</p></div>
      </div>
      <div className="space-y-3">
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {message && <p className="rounded-2xl bg-blush px-4 py-3 text-sm text-coral">{message}</p>}
        <button className="btn w-full" onClick={() => submit('signin')}>Sign In</button>
        <button className="icon-btn w-full" onClick={() => submit('signup')}>Create Account</button>
      </div>
    </section>
  </div>;
}

function Dashboard({ month, year }) {
  const { data, load } = useData(`/dashboard?month=${month}&year=${year}`, [month, year]);
  const cards = [
    ['Income', data.salary, IndianRupee, 'bg-coral'], ['Expenses', data.expenses, CreditCard, 'bg-[#ff7c97]'],
    ['EMI', data.emiPaid, Landmark, 'bg-[#4d5588]'], ['Balance', data.remaining, WalletCards, 'bg-mint'],
    ['Invested', data.investments, PiggyBank, 'bg-saffron']
  ];
  return <div className="space-y-6">
    <DashboardShowcase data={data} month={month} year={year} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, Icon, color]) => <Stat key={label} label={label} value={money(value)} Icon={Icon} color={color} />)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Panel title="Account-wise Balance"><div className="grid gap-3 sm:grid-cols-2">{(data.accounts || []).map((a) => <div className="rounded-3xl border border-stone-100 bg-[#fafafa] p-4" key={a.id}><p className="text-sm text-stone-500">{a.type}</p><h3 className="font-semibold">{a.name}</h3><p className="mt-2 text-xl font-bold">{money(a.balance)}</p></div>)}</div></Panel>
      <Panel title="Upcoming Reminders" action={<button onClick={load} className="icon-btn"><RefreshCcw size={16} /></button>}><List rows={data.reminders || []} render={(r) => <><b>{r.title}</b><span>{money(r.amount)} due {dateIn(r.due_date)}</span></>} /></Panel>
    </div>
    <Panel title="Recent Transactions"><List rows={data.recent || []} render={(r) => <><b>{r.kind}: {r.title}</b><span>{money(r.amount)} on {dateIn(r.date)} {r.notes ? `- ${r.notes}` : ''}</span></>} /></Panel>
  </div>;
}

function DashboardShowcase({ data, month, year }) {
  const recent = data.recent || [];
  const chartData = [
    { name: 'Income', value: data.salary || 0 },
    { name: 'Expense', value: data.expenses || 0 },
    { name: 'EMI', value: data.emiPaid || 0 },
    { name: 'Invest', value: data.investments || 0 }
  ];
  return <section className="overflow-hidden rounded-[2rem] bg-white p-5 shadow-soft md:p-8">
    <div className="grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <div className="max-w-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-coral text-white"><IndianRupee size={25} /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">FinTrack Pro</h1>
            <p className="mt-1 text-lg text-stone-600"><span className="font-semibold text-coral">The easiest way</span> to manage personal finances</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-blush p-4"><p className="text-xs font-semibold text-coral">Remaining</p><p className="mt-1 text-2xl font-bold">{money(data.remaining)}</p></div>
          <div className="rounded-3xl bg-[#f2f7ff] p-4"><p className="text-xs font-semibold text-blue-600">Month</p><p className="mt-1 text-2xl font-bold">{month}/{year}</p></div>
          <div className="rounded-3xl bg-[#f3fbf8] p-4"><p className="text-xs font-semibold text-mint">Accounts</p><p className="mt-1 text-2xl font-bold">{data.accounts?.length || 0}</p></div>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <PhonePreview title="Easy Content Access" tone="white">
          <div className="rounded-2xl border border-stone-100 bg-white p-3 shadow-soft">
            <div className="mb-3 flex items-center justify-between text-xs"><span>Transaction</span><span>{dateIn(`${year}-${String(month).padStart(2, '0')}-01`)}</span></div>
            <div className="grid grid-cols-3 rounded-xl bg-[#fafafa] p-2 text-center text-[11px]">
              <span className="text-mint">{money(data.salary)}</span><span className="text-coral">{money(data.expenses)}</span><span className="text-ink">{money(data.remaining)}</span>
            </div>
            <div className="mt-3 space-y-2">
              {recent.slice(0, 4).map((item, index) => <div className="flex items-center justify-between rounded-xl bg-[#fafafa] px-3 py-2 text-[11px]" key={index}><span>{item.title}</span><b className={item.kind === 'Expense' ? 'text-coral' : 'text-mint'}>{money(item.amount)}</b></div>)}
            </div>
          </div>
        </PhonePreview>
        <PhonePreview title="Improved Charts" tone="coral">
          <div className="rounded-2xl bg-white p-3 shadow-soft">
            <div className="h-36"><ResponsiveContainer><PieChart><Pie data={chartData} dataKey="value" innerRadius={28} outerRadius={55}>{chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie></PieChart></ResponsiveContainer></div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">{chartData.map((row, index) => <span key={row.name} className="rounded-xl bg-[#fafafa] px-2 py-1"><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: colors[index % colors.length] }} />{row.name}</span>)}</div>
          </div>
        </PhonePreview>
      </div>
    </div>
  </section>;
}

function PhonePreview({ title, tone, children }) {
  return <div className="phone-frame min-h-[360px]">
    <div className="phone-notch" />
    <div className={`${tone === 'coral' ? 'bg-coral text-white' : 'bg-white text-ink'} px-5 pb-4 pt-10 text-center`}>
      <p className="text-lg font-semibold">{title.split(' ').map((word) => word === 'Charts' || word === 'Content' ? <span className={tone === 'coral' ? 'text-white' : 'text-coral'} key={word}>{word} </span> : `${word} `)}</p>
    </div>
    <div className="bg-[#f7f7f7] p-4">{children}</div>
  </div>;
}

function Salary({ month, year }) {
  const { data, load } = useData('/salaries', []);
  const dash = useData(`/dashboard?month=${month}&year=${year}`, [month, year, data.length]);
  return <CrudPage title="Salary Records" table="salaries" rows={data} load={load}
    fields={[['month', 'number', 'Month'], ['year', 'number', 'Year'], ['amount', 'number', 'Amount'], ['notes', 'text', 'Notes']]}
    initial={{ month, year, amount: '', notes: '' }}
    extra={<div className="grid gap-4 md:grid-cols-3"><Stat label="Salary" value={money(dash.data.salary)} Icon={IndianRupee} color="bg-mint" /><Stat label="Used" value={money((dash.data.expenses || 0) + (dash.data.emiPaid || 0) + (dash.data.investments || 0))} Icon={CreditCard} color="bg-coral" /><Stat label="Remaining" value={money(dash.data.remaining)} Icon={WalletCards} color="bg-ink" /></div>} />;
}

function Expenses({ month, year }) {
  const [filters, setFilters] = useState({ category: '', account_id: '', payment_app_id: '' });
  const qs = new URLSearchParams({ month, year, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }).toString();
  const { data, load } = useData(`/expenses?${qs}`, [month, year, filters.category, filters.account_id, filters.payment_app_id]);
  const accounts = useData('/accounts', []);
  const apps = useData('/payment_apps', []);
  return <CrudPage title="Daily Expenses" table="expenses" rows={data} load={load}
    fields={[['date', 'date', 'Date'], ['amount', 'number', 'Amount'], ['category', 'select', 'Category', categories], ['notes', 'text', 'Notes'], ['payment_method', 'text', 'Payment method'], ['payment_app_id', 'select', 'Payment app', apps.data.map((a) => [a.id, a.name])], ['account_id', 'select', 'Account', accounts.data.map((a) => [a.id, a.name])]]}
    initial={{ date: iso(), amount: '', category: 'Food', notes: '', payment_method: 'UPI', payment_app_id: '', account_id: '' }}
    extra={<TransactionHeader rows={data} month={month} year={year} filters={filters} setFilters={setFilters} accounts={accounts.data} apps={apps.data} />} />;
}

function Loans() {
  const { data, load } = useData('/loans/summary/all', []);
  const accounts = useData('/accounts', []);
  const [pay, setPay] = useState({});
  const fields = [['loan_name', 'text', 'Loan name'], ['loan_type', 'text', 'Loan type'], ['total_amount', 'number', 'Total amount'], ['emi_amount', 'number', 'EMI amount'], ['start_date', 'date', 'Start date'], ['end_date', 'date', 'End date'], ['interest_rate', 'number', 'Interest %'], ['lender', 'text', 'Lender/bank'], ['account_id', 'select', 'Account', accounts.data.map((a) => [a.id, a.name])], ['due_day', 'number', 'Due day'], ['notes', 'text', 'Notes']];
  async function markPaid(loan) {
    await api(`/loans/${loan.id}/pay`, { method: 'POST', body: JSON.stringify({ payment_date: pay[loan.id]?.date || iso(), amount: pay[loan.id]?.amount || loan.emi_amount, account_id: loan.account_id, notes: 'Marked paid' }) });
    load();
  }
  return <CrudPage title="EMI / Loan Tracker" table="loans" rows={data} load={load} fields={fields} initial={{ loan_name: '', loan_type: 'Personal', total_amount: '', emi_amount: '', start_date: iso(), end_date: iso(), interest_rate: '', lender: '', account_id: '', due_day: 5, notes: '' }}
    renderExtraRow={(loan) => <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4"><span>Paid: {loan.emis_paid} EMIs</span><span>Total: {money(loan.total_paid)}</span><span>Left: {loan.remaining_emi_count} EMIs</span><span>Balance: {money(loan.remaining_amount)}</span><input className="input" type="date" value={pay[loan.id]?.date || iso()} onChange={(e) => setPay({ ...pay, [loan.id]: { ...pay[loan.id], date: e.target.value } })} /><input className="input" type="number" placeholder="Amount" onChange={(e) => setPay({ ...pay, [loan.id]: { ...pay[loan.id], amount: e.target.value } })} /><button onClick={() => markPaid(loan)} className="btn sm:col-span-2">Mark EMI Paid</button></div>} />;
}

function Accounts() {
  const { data, load } = useData('/accounts/balances/all', []);
  const accounts = useData('/accounts', [data.length]);
  return <CrudPage title="Accounts" table="accounts" rows={data} load={load}
    fields={[['name', 'text', 'Name'], ['type', 'select', 'Type', accountTypes], ['opening_balance', 'number', 'Opening balance'], ['notes', 'text', 'Notes']]}
    initial={{ name: '', type: 'Bank account', opening_balance: 0, notes: '' }}
    extra={<TransferForm accounts={accounts.data} onDone={load} />}
    renderExtraRow={(a) => <p className="mt-2 text-xl font-bold">{money(a.balance)}</p>} />;
}

function Investments({ month, year }) {
  const { data, load } = useData(`/investments?month=${month}&year=${year}`, [month, year]);
  const accounts = useData('/accounts', []);
  return <CrudPage title="Investments" table="investments" rows={data} load={load}
    fields={[['name', 'text', 'Investment name'], ['type', 'select', 'Type', investmentTypes], ['amount', 'number', 'Amount'], ['date', 'date', 'Date'], ['account_id', 'select', 'Account', accounts.data.map((a) => [a.id, a.name])], ['notes', 'text', 'Notes']]}
    initial={{ name: '', type: 'SIP', amount: '', date: iso(), account_id: '', notes: '' }} />;
}

function PaymentApps({ month, year }) {
  const { data, load } = useData('/payment_apps', []);
  const report = useData(`/reports?month=${month}&year=${year}`, [month, year]);
  return <CrudPage title="Payment Apps" table="payment_apps" rows={data} load={load}
    fields={[['name', 'text', 'App name'], ['type', 'select', 'Type', appTypes], ['notes', 'text', 'Notes']]}
    initial={{ name: '', type: 'Google Pay', notes: '' }}
    extra={<Panel title="Paid Through Each App"><MiniBars data={report.data.byPaymentApp || []} /></Panel>} />;
}

function Reminders() {
  const { data, load } = useData('/reminders', []);
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);
  async function complete(row) {
    await api(`/reminders/${row.id}`, { method: 'PUT', body: JSON.stringify({ completed: row.completed ? 0 : 1 }) });
    if ('Notification' in window && Notification.permission === 'granted') new Notification('FinTrack Pro', { body: `${row.title} marked ${row.completed ? 'pending' : 'completed'}` });
    load();
  }
  return <CrudPage title="Reminders" table="reminders" rows={data} load={load}
    fields={[['title', 'text', 'Title'], ['amount', 'number', 'Amount'], ['due_date', 'date', 'Due date'], ['repeat_monthly', 'checkbox', 'Repeat monthly'], ['notes', 'text', 'Notes'], ['completed', 'checkbox', 'Completed']]}
    initial={{ title: '', amount: '', due_date: iso(), repeat_monthly: 0, notes: '', completed: 0 }}
    renderExtraRow={(r) => <button onClick={() => complete(r)} className="mt-3 rounded border border-stone-300 px-3 py-2 text-sm">{r.completed ? 'Mark pending' : 'Mark completed'}</button>} />;
}

function Reports({ month, year }) {
  const { data } = useData(`/reports?month=${month}&year=${year}`, [month, year]);
  return <div className="space-y-6">
    <ReportShowcase data={data} month={month} year={year} />
    <div className="grid gap-6 xl:grid-cols-2">
    <Panel title="Monthly Expense Report"><Chart data={data.byCategory || []} /></Panel>
    <Panel title="Category-wise Expense Report"><PieBlock data={data.byCategory || []} /></Panel>
    <Panel title="EMI Report"><MiniBars data={data.emi || []} /></Panel>
    <Panel title="Account-wise Report"><MiniBars data={data.byAccount || []} /></Panel>
    <Panel title="Payment App-wise Report"><MiniBars data={data.byPaymentApp || []} /></Panel>
    <Panel title="Salary Remaining Report"><div className="grid gap-3 sm:grid-cols-2"><Stat label="Salary" value={money(data.salaryRemaining?.salary)} Icon={IndianRupee} color="bg-mint" /><Stat label="Remaining" value={money(data.salaryRemaining?.remaining)} Icon={WalletCards} color="bg-ink" /></div></Panel>
    </div>
  </div>;
}

function SettingsPage() {
  const [q, setQ] = useState('');
  const { data, load } = useData(`/search?q=${encodeURIComponent(q)}`, [q]);
  const [importTable, setImportTable] = useState('expenses');
  async function uploadCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    await importCsv(importTable, file);
    load();
  }
  return <div className="space-y-6">
    <Panel title="Search Transactions"><div className="flex gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 text-stone-400" size={18} /><input className="input pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expenses, investments, reminders" /></div></div><List rows={data} render={(r) => <><b>{r.kind}: {r.title}</b><span>{money(r.amount)} on {dateIn(r.date)}</span></>} /></Panel>
    <Panel title="Data Management"><div className="grid gap-3 md:grid-cols-3"><select className="input" value={importTable} onChange={(e) => setImportTable(e.target.value)}>{Object.keys({ expenses: 1, salaries: 1, accounts: 1, investments: 1, payment_apps: 1, reminders: 1, loans: 1, emi_payments: 1, transfers: 1 }).map((t) => <option key={t}>{t}</option>)}</select><input className="input" type="file" accept=".csv" onChange={uploadCsv} /><button className="btn text-center" type="button" onClick={() => exportCsv(importTable)}><Download className="inline" size={16} /> Export CSV</button></div></Panel>
  </div>;
}

function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setUsers(await listProfiles());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  async function change(user, patch) {
    await updateProfile(user.id, patch);
    load();
  }
  return <Panel title="User Access Control">
    <div className="space-y-3">
      {loading && <p className="text-sm text-stone-500">Loading users...</p>}
      {users.map((user) => <article className="transaction-row" key={user.id}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">{user.email || user.id}</h3>
            <p className="text-sm text-stone-500">Role: {user.role} - Status: {user.status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="icon-btn" onClick={() => change(user, { status: 'approved' })}>Approve</button>
            <button className="icon-btn" onClick={() => change(user, { status: 'pending' })}>Pending</button>
            <button className="icon-btn text-coral" onClick={() => change(user, { status: 'blocked' })}>Block</button>
            <button className="icon-btn" onClick={() => change(user, { role: user.role === 'admin' ? 'user' : 'admin' })}>{user.role === 'admin' ? 'Make User' : 'Make Admin'}</button>
          </div>
        </div>
      </article>)}
      {!loading && !users.length && <p className="text-sm text-stone-500">No users found.</p>}
    </div>
  </Panel>;
}

function CrudPage({ title, table, rows, load, fields, initial, extra, renderExtraRow }) {
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  async function save(e) {
    e.preventDefault();
    const body = normalize(form, fields);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/${table}/${editing}` : `/${table}`;
    await api(url, { method, body: JSON.stringify(body) });
    setForm(initial); setEditing(null); load();
  }
  async function del(id) {
    await api(`/${table}/${id}`, { method: 'DELETE' });
    load();
  }
  return <div className="space-y-6">
    {extra}
    <Panel title={editing ? `Edit ${title}` : `Add ${title}`} action={editing && <button className="text-sm text-stone-500" onClick={() => { setEditing(null); setForm(initial); }}>Cancel</button>}>
      <form onSubmit={save} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fields.map(([name, type, label, options]) => <Field key={name} name={name} type={type} label={label} options={options} value={form[name] ?? ''} onChange={(value) => setForm({ ...form, [name]: value })} />)}
        <button className="btn md:self-end"><Plus size={16} /> {editing ? 'Update' : 'Add'}</button>
      </form>
    </Panel>
    <Panel title={title}>
      <div className="grid gap-3">
        {rows.map((row) => <article className="rounded border border-stone-200 bg-white p-4" key={row.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-semibold">{row.name || row.title || row.loan_name || row.category || `${title} #${row.id}`}</h3><p className="text-sm text-stone-500">{summary(row)}</p>{renderExtraRow?.(row)}</div>
            <div className="flex gap-2"><button className="icon-btn" onClick={() => { setEditing(row.id); setForm({ ...initial, ...row }); }}>Edit</button><button className="icon-btn text-coral" onClick={() => del(row.id)}><Trash2 size={16} /></button></div>
          </div>
        </article>)}
        {!rows.length && <p className="py-6 text-center text-stone-500">No records found.</p>}
      </div>
    </Panel>
  </div>;
}

function Field({ name, type, label, value, onChange, options = [] }) {
  if (type === 'checkbox') return <label className="flex items-center gap-2 rounded border border-stone-200 bg-white px-3 py-3 text-sm"><input type="checkbox" checked={!!Number(value)} onChange={(e) => onChange(e.target.checked ? 1 : 0)} /> {label}</label>;
  if (type === 'select') return <label className="text-sm font-medium">{label}<select required className="input mt-1" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">Select</option>{options.map((o) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}</select></label>;
  return <label className="text-sm font-medium">{label}<input required={['amount', 'date', 'name', 'title'].some((part) => name.includes(part))} className="input mt-1" type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function TransactionHeader({ rows, month, year, filters, setFilters, accounts, apps }) {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return <div className="space-y-4">
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-soft">
      <div className="bg-coral px-5 pb-5 pt-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm opacity-80">Transaction</p>
            <h3 className="text-2xl font-bold">Expense</h3>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 text-sm">{new Date(year, month - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}</div>
        </div>
        <div className="mt-5 grid grid-cols-3 rounded-2xl bg-white/15 p-3 text-center text-sm">
          <span>Daily</span><span className="rounded-xl bg-white text-coral">Monthly</span><span>Summary</span>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <div className="rounded-3xl bg-blush p-4"><p className="text-xs font-semibold text-coral">Expense Count</p><p className="mt-1 text-2xl font-bold">{rows.length}</p></div>
        <div className="rounded-3xl bg-[#f8f8f8] p-4"><p className="text-xs font-semibold text-stone-500">Total Paid</p><p className="mt-1 text-2xl font-bold">{money(total)}</p></div>
        <div className="rounded-3xl bg-[#f3fbf8] p-4"><p className="text-xs font-semibold text-mint">Average</p><p className="mt-1 text-2xl font-bold">{money(rows.length ? total / rows.length : 0)}</p></div>
      </div>
    </section>
    <Filters filters={filters} setFilters={setFilters} accounts={accounts} apps={apps} />
  </div>;
}

function Filters({ filters, setFilters, accounts, apps }) {
  const active = [filters.category, filters.payment_app_id, filters.account_id].filter(Boolean).length;
  return <section className="rounded-[1.75rem] bg-[#34395f] p-4 text-white shadow-soft">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-semibold">Reinforced Filter</h3>
      <button onClick={() => setFilters({ category: '', account_id: '', payment_app_id: '' })} className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold">Clear {active ? `(${active})` : ''}</button>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <select className="input border-white/20 bg-white text-ink" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
      <select className="input border-white/20 bg-white text-ink" value={filters.payment_app_id} onChange={(e) => setFilters({ ...filters, payment_app_id: e.target.value })}><option value="">All payment apps</option>{apps.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}</select>
      <select className="input border-white/20 bg-white text-ink" value={filters.account_id} onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}><option value="">All accounts</option>{accounts.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}</select>
    </div>
  </section>;
}

function ReportShowcase({ data, month, year }) {
  const category = data.byCategory || [];
  const salary = data.salaryRemaining || {};
  return <section className="overflow-hidden rounded-[2rem] bg-white shadow-soft">
    <div className="bg-coral px-5 py-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm opacity-80">Stats</p>
          <h3 className="text-2xl font-bold">Aesthetically Improved Charts</h3>
        </div>
        <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm">{new Date(year, month - 1).toLocaleString('en-IN', { month: 'short yyyy' })}</div>
      </div>
    </div>
    <div className="grid gap-5 p-5 lg:grid-cols-[.85fr_1.15fr]">
      <div className="rounded-[1.75rem] border border-stone-100 bg-[#fafafa] p-4">
        <div className="h-64"><ResponsiveContainer><PieChart><Pie data={category} dataKey="value" nameKey="name" outerRadius={86} label>{category.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer></div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 rounded-3xl bg-[#fafafa] p-4 text-center">
          <div><p className="text-xs text-stone-500">Income</p><b className="text-mint">{money(salary.salary)}</b></div>
          <div><p className="text-xs text-stone-500">Expenses</p><b className="text-coral">{money(salary.expenses)}</b></div>
          <div><p className="text-xs text-stone-500">Total</p><b>{money(salary.remaining)}</b></div>
        </div>
        {category.slice(0, 6).map((row, index) => <div key={row.name} className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
          <span className="flex items-center gap-2 text-sm"><i className="h-3 w-3 rounded-full" style={{ background: colors[index % colors.length] }} />{row.name}</span>
          <b>{money(row.value)}</b>
        </div>)}
      </div>
    </div>
  </section>;
}

function TransferForm({ accounts, onDone }) {
  const [form, setForm] = useState({ from_account_id: '', to_account_id: '', amount: '', date: iso(), notes: '' });
  async function save(e) { e.preventDefault(); await api('/transfers', { method: 'POST', body: JSON.stringify(form) }); setForm({ from_account_id: '', to_account_id: '', amount: '', date: iso(), notes: '' }); onDone(); }
  return <Panel title="Account Transfer"><form onSubmit={save} className="grid gap-3 md:grid-cols-5"><Field name="from_account_id" type="select" label="From" value={form.from_account_id} options={accounts.map((a) => [a.id, a.name])} onChange={(v) => setForm({ ...form, from_account_id: v })} /><Field name="to_account_id" type="select" label="To" value={form.to_account_id} options={accounts.map((a) => [a.id, a.name])} onChange={(v) => setForm({ ...form, to_account_id: v })} /><Field name="amount" type="number" label="Amount" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} /><Field name="date" type="date" label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><button className="btn self-end">Transfer</button></form></Panel>;
}

function Panel({ title, children, action }) { return <section className="soft-panel"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-bold tracking-tight">{title}</h3>{action}</div>{children}</section>; }
function Stat({ label, value, Icon, color }) { return <div className="rounded-[1.75rem] border border-stone-100 bg-white p-4 shadow-soft"><div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${color} text-white`}><Icon size={20} /></div><p className="text-sm font-medium text-stone-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p></div>; }
function List({ rows, render }) { return <div className="space-y-2">{rows.map((row, i) => <div className="transaction-row flex flex-col gap-1 text-sm" key={row.id || i}>{render(row)}</div>)} {!rows.length && <p className="py-4 text-sm text-stone-500">Nothing to show.</p>}</div>; }
function Chart({ data }) { return <div className="h-72"><ResponsiveContainer><AreaChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#f1e4e2" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Area type="monotone" dataKey="value" stroke="#ff4f45" fill="#ffe1df" /></AreaChart></ResponsiveContainer></div>; }
function MiniBars({ data }) { return <div className="h-72"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#f1e4e2" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="value" fill="#ff4f45" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>; }
function PieBlock({ data }) { return <div className="h-72"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer></div>; }
function iso() { return new Date().toISOString().slice(0, 10); }
function normalize(form, fields) {
  const out = { ...form };
  fields.forEach(([name, type]) => {
    if (type === 'number' && out[name] !== '') out[name] = Number(out[name]);
    if (type === 'checkbox') out[name] = Number(out[name] || 0);
    if (out[name] === '') out[name] = null;
  });
  return out;
}
function summary(row) {
  const parts = [];
  if (row.amount || row.opening_balance || row.total_amount) parts.push(money(row.amount || row.opening_balance || row.total_amount));
  if (row.date || row.payment_date || row.due_date || row.start_date) parts.push(dateIn(row.date || row.payment_date || row.due_date || row.start_date));
  if (row.account_name) parts.push(row.account_name);
  if (row.payment_app_name) parts.push(row.payment_app_name);
  if (row.notes) parts.push(row.notes);
  return parts.join(' - ') || row.type || '';
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><AuthGate /></ErrorBoundary>);
