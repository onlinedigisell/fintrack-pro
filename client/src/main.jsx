import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Bell, CheckCircle2, CreditCard, Download, Home, IndianRupee, Landmark, LineChart, Menu, PiggyBank, Plus, RefreshCcw, Search, Settings, ShieldCheck, Smartphone, Sparkles, Trash2, UserCircle, WalletCards, X } from 'lucide-react';
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
const cardNetworks = ['Visa', 'Mastercard', 'RuPay', 'Amex', 'Other'];
const paymentSources = ['Cash', 'Bank account', 'UPI app', 'Direct Credit Card', 'UPI via RuPay Credit Card'];
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
  const initialPage = new URLSearchParams(window.location.search).get('page') || 'Dashboard';
  const [page, setPage] = useState(initialPage);
  const [moreOpen, setMoreOpen] = useState(false);
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [standalone, setStandalone] = useState(false);
  const overview = useData(`/dashboard?month=${month}&year=${year}`, [month, year]);
  const nav = [
    ['Dashboard', Home], ['Salary', IndianRupee], ['Expenses', CreditCard], ['Credit Cards', CreditCard], ['EMI / Loans', Landmark],
    ['Accounts', WalletCards], ['Investments', PiggyBank], ['Payment Apps', Smartphone], ['Reminders', Bell],
    ['Reports', LineChart], ['Settings', Settings]
  ];
  if (profile?.role === 'admin') nav.push(['Users', ShieldCheck]);
  const mobileTabs = nav.filter(([name]) => ['Dashboard', 'Expenses', 'Accounts', 'Reports'].includes(name));
  const morePages = nav.filter(([name]) => !mobileTabs.some(([tab]) => tab === name));
  const isMorePage = morePages.some(([name]) => name === page);
  useEffect(() => {
    const standaloneMode = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    setStandalone(Boolean(standaloneMode));
    const onInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', onInstall);
    return () => window.removeEventListener('beforeinstallprompt', onInstall);
  }, []);
  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }
  function go(nextPage) {
    setPage(nextPage);
    setMoreOpen(false);
  }
  return (
    <div className="min-h-dvh bg-slate-950 text-ink">
      <div className="mx-auto min-h-dvh max-w-[1800px] bg-paper md:rounded-none">
      <aside className="fixed bottom-0 left-0 right-0 z-30 hidden border-t border-slate-200 bg-white/95 pb-safe shadow-[0_-16px_35px_rgba(0,0,0,0.08)] backdrop-blur md:top-4 md:bottom-4 md:left-4 md:right-auto md:block md:h-auto md:w-72 md:rounded-[1.5rem] md:border md:border-slate-200 md:pb-0 md:shadow-phone">
        <div className="hidden px-6 py-6 md:block">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 text-white shadow-soft"><IndianRupee size={22} /></div>
            <div><h1 className="text-xl font-bold">FinTrack Pro</h1><p className="text-xs text-slate-500">Premium finance OS</p></div>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 py-2 md:block md:px-3">
          {nav.map(([name, Icon]) => (
            <button key={name} onClick={() => go(name)} title={name} className={`nav-btn ${page === name ? 'bg-coral text-white shadow-soft' : 'text-stone-500 hover:bg-blush hover:text-coral'}`}>
              <Icon size={18} /><span>{name}</span>
            </button>
          ))}
        </nav>
      </aside>
      <MobileBottomNav tabs={mobileTabs} page={page} isMorePage={isMorePage} onPage={go} onMore={() => setMoreOpen(true)} />
      {moreOpen && <MoreSheet pages={morePages} active={page} onClose={() => setMoreOpen(false)} onPage={go} />}
      <main className="pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:ml-80 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-paper/90 px-4 pb-3 pt-safe backdrop-blur-xl md:px-8 md:pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-coral">FinTrack Pro / {page}</p>
              <h2 className="truncate text-2xl font-bold tracking-tight md:text-3xl">{page}</h2>
              {isSupabaseMode && <p className="mt-1 text-xs font-semibold text-emerald-600">{standalone ? 'Mobile app mode' : 'Online database connected'} {profile?.role === 'admin' ? '- Admin' : ''}</p>}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2">
              <div className="relative hidden min-w-[220px] max-w-sm flex-1 lg:block">
                <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
                <input className="input h-11 pl-10" placeholder="Search transactions, cards, reminders" />
              </div>
              <NotificationBell items={buildNotifications(overview.data || {})} />
              {installPrompt && <button className="icon-btn hidden sm:inline-flex" onClick={installApp}><Download size={16} /> Install</button>}
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 sm:flex"><UserCircle size={18} />{profile?.role || 'User'}</div>
              {isSupabaseMode && <button className="icon-btn px-3" onClick={() => supabase.auth.signOut()}>Sign out</button>}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_6.5rem] gap-2 sm:flex sm:justify-end">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input h-11">{Array.from({ length: 12 }, (_, i) => <option value={i + 1} key={i}>{new Date(2026, i).toLocaleString('en-IN', { month: 'long' })}</option>)}</select>
            <input value={year} onChange={(e) => setYear(Number(e.target.value))} type="number" className="input h-11 sm:w-28" />
          </div>
        </header>
        <section className="px-3 py-4 sm:px-4 md:px-8 md:py-6">
          {page === 'Dashboard' && <Dashboard month={month} year={year} />}
          {page === 'Salary' && <Salary month={month} year={year} />}
          {page === 'Expenses' && <Expenses month={month} year={year} />}
          {page === 'Credit Cards' && <CreditCards month={month} year={year} />}
          {page === 'EMI / Loans' && <Loans />}
          {page === 'Accounts' && <Accounts />}
          {page === 'Investments' && <Investments month={month} year={year} />}
          {page === 'Payment Apps' && <PaymentApps month={month} year={year} />}
          {page === 'Reminders' && <Reminders />}
          {page === 'Reports' && <Reports month={month} year={year} />}
          {page === 'Settings' && <SettingsPage installPrompt={installPrompt} installApp={installApp} standalone={standalone} />}
          {page === 'Users' && profile?.role === 'admin' && <UsersAdmin />}
        </section>
      </main>
      </div>
    </div>
  );
}

function MobileBottomNav({ tabs, page, isMorePage, onPage, onMore }) {
  return <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-white/96 px-2 pb-safe pt-2 shadow-[0_-14px_34px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
    {tabs.map(([name, Icon]) => (
      <button key={name} onClick={() => onPage(name)} className={`bottom-tab ${page === name ? 'text-coral' : 'text-stone-500'}`} title={name}>
        <Icon size={20} />
        <span>{name}</span>
      </button>
    ))}
    <button onClick={onMore} className={`bottom-tab ${isMorePage ? 'text-coral' : 'text-stone-500'}`} title="More">
      <Menu size={20} />
      <span>More</span>
    </button>
  </nav>;
}

function MoreSheet({ pages, active, onClose, onPage }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-black/35 px-3 pb-safe pt-20 md:hidden" onClick={onClose}>
    <section className="mt-auto rounded-[1.25rem] bg-white p-4 shadow-phone" onClick={(event) => event.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">More</h3>
          <p className="text-sm text-stone-500">All finance tools</p>
        </div>
        <button className="icon-btn h-10 w-10 px-0" onClick={onClose} title="Close"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {pages.map(([name, Icon]) => (
          <button key={name} onClick={() => onPage(name)} className={`sheet-btn ${active === name ? 'border-coral bg-blush text-coral' : 'border-stone-200 bg-white text-ink'}`}>
            <Icon size={18} />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </section>
  </div>;
}

function NotificationBell({ items }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState({});
  const unread = items.filter((item) => !read[item.id]).length;
  return <div className="relative">
    <button className="icon-btn relative h-11 w-11 px-0" onClick={() => setOpen(!open)} title="Notifications">
      <Bell size={18} />
      {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
    </button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-phone">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">Notifications</h3>
        <button className="text-xs font-semibold text-coral" onClick={() => setRead(Object.fromEntries(items.map((item) => [item.id, true])))}>Mark all read</button>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {items.map((item) => <button key={item.id} onClick={() => setRead({ ...read, [item.id]: true })} className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${read[item.id] ? 'border-slate-100 bg-slate-50 text-slate-500' : 'border-indigo-100 bg-blush text-ink'}`}>
          <b>{item.title}</b>
          <p className="mt-1 text-xs">{item.message}</p>
        </button>)}
        {!items.length && <p className="py-6 text-center text-sm text-slate-500">No alerts right now.</p>}
      </div>
      {!!items.length && <button className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => setRead({})}>Clear read state</button>}
    </div>}
  </div>;
}

function AuthGate() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseMode);
  const [error, setError] = useState('');
  async function loadProfile(nextSession, alive = () => true) {
    setSession(nextSession);
    setError('');
    if (!nextSession) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const nextProfile = await withTimeout(getMyProfile(), 10000, 'Profile loading timed out. Please refresh once or sign in again.');
      if (alive()) setProfile(nextProfile);
    } catch (err) {
      if (alive()) {
        setError(err.message || 'Unable to load account profile');
        setProfile(null);
      }
    } finally {
      if (alive()) setLoading(false);
    }
  }
  useEffect(() => {
    if (!isSupabaseMode) return;
    let alive = true;
    const isAlive = () => alive;
    withTimeout(supabase.auth.getSession(), 10000, 'Login check timed out. Please refresh once or sign in again.')
      .then(({ data }) => loadProfile(data.session, isAlive))
      .catch((err) => {
        if (alive) {
          setError(err.message || 'Unable to check login');
          setLoading(false);
        }
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      window.setTimeout(() => loadProfile(nextSession, isAlive), 0);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  if (supabaseConfigError) return <SetupError message={supabaseConfigError} />;
  if (!isSupabaseMode) return <Shell />;
  if (loading) return <LoadingScreen />;
  if (error) return <AccessMessage title="Setup needs attention" message={error} detail="Refresh once. If it continues, sign out and sign in again." action={<button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>} />;
  if (!session) return <LoginScreen />;
  if (profile?.status === 'pending') return <AccessMessage title="Waiting for admin approval" message="Your account is created, but the admin must approve it before you can use FinTrack Pro." />;
  if (profile?.status === 'blocked') return <AccessMessage title="Access blocked" message="Your account access is blocked. Contact the FinTrack Pro admin." />;
  if (profile?.status !== 'approved') return <AccessMessage title="Access not active" message="Your account is not approved yet." />;
  return <Shell profile={profile} />;
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

function LoadingScreen() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);
  return <div className="grid min-h-screen place-items-center bg-paper px-4 text-ink">
    <section className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-soft">
      <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-2xl bg-coral" />
      <h1 className="text-xl font-bold">Loading FinTrack Pro...</h1>
      {slow && <div className="mt-4 space-y-3">
        <p className="text-sm text-stone-500">Taking longer than expected. Refresh once, or sign out and sign in again.</p>
        <div className="flex justify-center gap-2">
          <button className="icon-btn" onClick={() => window.location.reload()}>Refresh</button>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>}
    </section>
  </div>;
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
  const [notificationStatus, setNotificationStatus] = useState(notificationPermission());
  const cards = [
    ['Income', data.salary, IndianRupee, 'bg-coral'], ['Expenses', data.expenses, CreditCard, 'bg-slate-700'],
    ['EMI', data.emiPaid, Landmark, 'bg-[#4d5588]'], ['Balance', data.remaining, WalletCards, Number(data.remaining || 0) < 0 ? 'bg-danger' : 'bg-mint'],
    ['Invested', data.investments, PiggyBank, 'bg-saffron'], ['Card Used', data.creditCardSummary?.usedLimit, CreditCard, 'bg-indigo-600'],
    ['Available Credit', data.creditCardSummary?.availableLimit, WalletCards, 'bg-emerald-600']
  ];
  useEffect(() => {
    if (notificationStatus === 'granted') notifyUpcomingEmis(data.emiReminders || []);
  }, [notificationStatus, JSON.stringify((data.emiReminders || []).map((row) => row.id))]);
  async function enableEmiNotifications() {
    if (!('Notification' in window)) return setNotificationStatus('unsupported');
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') notifyUpcomingEmis(data.emiReminders || [], true);
  }
  async function markEmiPaid(emi) {
    await api(`/loans/${emi.loan_id}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        payment_date: emi.due_date,
        amount: emi.amount,
        account_id: emi.account_id,
        notes: `Paid from EMI reminder for ${dateIn(emi.due_date)}`
      })
    });
    load();
  }
  return <div className="space-y-4 md:space-y-6">
    <DashboardShowcase data={data} month={month} year={year} />
    <AIInsightsPanel insights={dashboardInsights(data)} />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">{cards.map(([label, value, Icon, color]) => <Stat key={label} label={label} value={money(value)} Icon={Icon} color={color} />)}</div>
    <Panel title="Quick Actions">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">{['Add Salary', 'Add Expense', 'Add EMI', 'Add Investment', 'Transfer Account', 'Add Reminder', 'Add Credit Card Transaction'].map((label) => <button className="icon-btn justify-start" key={label}><Plus size={16} />{label}</button>)}</div>
    </Panel>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <Panel title="Account-wise Balance"><div className="grid gap-3 sm:grid-cols-2">{(data.accounts || []).map((a) => <div className="rounded-2xl border border-stone-100 bg-[#fafafa] p-3 md:p-4" key={a.id}><p className="text-xs text-stone-500 md:text-sm">{a.type}</p><h3 className="font-semibold">{a.name}</h3><p className="mt-2 text-lg font-bold md:text-xl">{money(a.balance)}</p></div>)}</div></Panel>
      <Panel title="Upcoming Reminders" action={<button onClick={load} className="icon-btn"><RefreshCcw size={16} /></button>}><List rows={data.reminders || []} render={(r) => <><b>{r.title}</b><span>{money(r.amount)} due {dateIn(r.due_date)}</span></>} /></Panel>
    </div>
    <Panel title="EMI Deduction Alerts" action={notificationStatus !== 'granted' && <button onClick={enableEmiNotifications} className="icon-btn"><Bell size={16} /> Enable</button>}>
      <EmiReminderList rows={data.emiReminders || []} onPaid={markEmiPaid} notificationStatus={notificationStatus} />
    </Panel>
    <Panel title="Recent Credit Card Transactions"><List rows={data.cardTransactions || []} render={(r) => <><b>{r.merchant || r.category}</b><span>{money(r.amount)} on {dateIn(r.transaction_date)} via {r.payment_source}</span></>} /></Panel>
    <Panel title="Recent Transactions"><List rows={data.recent || []} render={(r) => <><b>{r.kind}: {r.title}</b><span>{money(r.amount)} on {dateIn(r.date)} {r.notes ? `- ${r.notes}` : ''}</span></>} /></Panel>
  </div>;
}

function EmiReminderList({ rows, onPaid, notificationStatus }) {
  if (!rows.length) return <p className="py-4 text-sm text-stone-500">No upcoming unpaid EMI deductions in the next 45 days.</p>;
  return <div className="space-y-3">
    {notificationStatus === 'denied' && <p className="rounded-xl bg-blush px-3 py-2 text-sm text-coral">Browser notifications are blocked. Enable notifications from browser site settings.</p>}
    {notificationStatus === 'unsupported' && <p className="rounded-xl bg-blush px-3 py-2 text-sm text-coral">This browser does not support notifications.</p>}
    {rows.map((emi) => {
      const dueIn = daysUntil(emi.due_date);
      return <article className="transaction-row" key={emi.id}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <b>{emi.loan_name}</b>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${dueIn <= 3 ? 'bg-blush text-coral' : 'bg-[#f3fbf8] text-mint'}`}>{dueIn === 0 ? 'Due today' : `${dueIn} day${dueIn === 1 ? '' : 's'} left`}</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">{money(emi.amount)} deduction on {dateIn(emi.due_date)}{emi.account_name ? ` from ${emi.account_name}` : ''}</p>
            {emi.lender && <p className="text-xs text-stone-400">{emi.lender}</p>}
          </div>
          <button className="btn" onClick={() => onPaid(emi)}>Mark EMI Paid</button>
        </div>
      </article>;
    })}
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
  return <section className="overflow-hidden rounded-[1.25rem] bg-white p-4 shadow-soft md:rounded-[1.75rem] md:p-8">
    <div className="grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <div className="max-w-xl">
        <div className="mb-4 flex items-center gap-3 md:mb-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-coral text-white md:h-12 md:w-12"><IndianRupee size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-5xl">FinTrack Pro</h1>
            <p className="mt-1 text-sm text-stone-600 md:text-lg"><span className="font-semibold text-coral">Professional</span> personal finance control</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 md:gap-3">
          <div className="rounded-2xl bg-blush p-3 md:p-4"><p className="text-xs font-semibold text-coral">Remaining</p><p className="mt-1 text-xl font-bold md:text-2xl">{money(data.remaining)}</p></div>
          <div className="rounded-2xl bg-[#f2f7ff] p-3 md:p-4"><p className="text-xs font-semibold text-blue-600">Month</p><p className="mt-1 text-xl font-bold md:text-2xl">{month}/{year}</p></div>
          <div className="rounded-2xl bg-[#f3fbf8] p-3 md:p-4"><p className="text-xs font-semibold text-mint">Accounts</p><p className="mt-1 text-xl font-bold md:text-2xl">{data.accounts?.length || 0}</p></div>
        </div>
      </div>
      <div className="hidden gap-5 lg:grid lg:grid-cols-2">
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

function CreditCards({ month, year }) {
  const cards = useData('/credit_cards', []);
  const transactions = useData(`/credit_card_transactions?month=${month}&year=${year}`, [month, year]);
  const apps = useData('/payment_apps', []);
  const accounts = useData('/accounts', []);
  const [cardForm, setCardForm] = useState({ card_name: '', bank_name: '', network: 'RuPay', last4: '', credit_limit: '', used_limit: 0, billing_start_day: 1, billing_end_day: 30, due_day: 20, minimum_due: 0, total_due: 0, linked_upi_apps: '', notes: '', active: 1 });
  const [txForm, setTxForm] = useState({ transaction_date: iso(), merchant: '', amount: '', category: 'Shopping', payment_source: 'Direct Credit Card', transaction_type: 'Purchase', credit_card_id: '', payment_app_id: '', account_id: '', notes: '' });
  const summary = summarizeCards(cards.data, transactions.data);
  async function saveCard(e) {
    e.preventDefault();
    await api('/credit_cards', { method: 'POST', body: JSON.stringify(cardForm) });
    setCardForm({ card_name: '', bank_name: '', network: 'RuPay', last4: '', credit_limit: '', used_limit: 0, billing_start_day: 1, billing_end_day: 30, due_day: 20, minimum_due: 0, total_due: 0, linked_upi_apps: '', notes: '', active: 1 });
    cards.load();
  }
  async function saveTransaction(e) {
    e.preventDefault();
    await api('/credit_card_transactions', { method: 'POST', body: JSON.stringify(txForm) });
    setTxForm({ transaction_date: iso(), merchant: '', amount: '', category: 'Shopping', payment_source: 'Direct Credit Card', transaction_type: 'Purchase', credit_card_id: '', payment_app_id: '', account_id: '', notes: '' });
    transactions.load();
    cards.load();
  }
  if (cards.error || transactions.error) return <SetupMissing title="Credit Cards setup needed" message="Run supabase/credit-cards.sql in Supabase SQL Editor once, then refresh this page." />;
  return <div className="space-y-4 md:space-y-6">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Stat label="Total Limit" value={money(summary.totalLimit)} Icon={CreditCard} color="bg-coral" />
      <Stat label="Used Limit" value={money(summary.usedLimit)} Icon={AlertTriangle} color={summary.usedLimit > summary.totalLimit * .8 ? 'bg-danger' : 'bg-saffron'} />
      <Stat label="Available" value={money(summary.availableLimit)} Icon={WalletCards} color="bg-mint" />
      <Stat label="Month Spend" value={money(summary.currentMonthSpend)} Icon={LineChart} color="bg-ink" />
    </div>
    <AIInsightsPanel insights={creditCardInsights(cards.data, transactions.data)} />
    <Panel title="Credit Card Wallet">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {cards.data.map((card) => <CreditCardWidget key={card.id} card={card} />)}
        {!cards.data.length && <EmptyState title="No credit cards yet" message="Add your first credit card to track limits, RuPay UPI transactions, and due dates." />}
      </div>
    </Panel>
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Add Credit Card">
        <form onSubmit={saveCard} className="grid gap-3 md:grid-cols-2">
          <FormField label="Card name"><input required className="input" value={cardForm.card_name} onChange={(e) => setCardForm({ ...cardForm, card_name: e.target.value })} /></FormField>
          <FormField label="Bank name"><input required className="input" value={cardForm.bank_name} onChange={(e) => setCardForm({ ...cardForm, bank_name: e.target.value })} /></FormField>
          <FormField label="Network"><select className="input" value={cardForm.network} onChange={(e) => setCardForm({ ...cardForm, network: e.target.value })}>{cardNetworks.map((item) => <option key={item}>{item}</option>)}</select></FormField>
          <FormField label="Last 4 digits"><input className="input" maxLength="4" value={cardForm.last4} onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value })} /></FormField>
          <FormField label="Total credit limit"><input required className="input" type="number" value={cardForm.credit_limit} onChange={(e) => setCardForm({ ...cardForm, credit_limit: e.target.value })} /></FormField>
          <FormField label="Used limit"><input className="input" type="number" value={cardForm.used_limit} onChange={(e) => setCardForm({ ...cardForm, used_limit: e.target.value })} /></FormField>
          <FormField label="Billing start day"><input className="input" type="number" min="1" max="31" value={cardForm.billing_start_day} onChange={(e) => setCardForm({ ...cardForm, billing_start_day: e.target.value })} /></FormField>
          <FormField label="Billing end day"><input className="input" type="number" min="1" max="31" value={cardForm.billing_end_day} onChange={(e) => setCardForm({ ...cardForm, billing_end_day: e.target.value })} /></FormField>
          <FormField label="Payment due day"><input className="input" type="number" min="1" max="31" value={cardForm.due_day} onChange={(e) => setCardForm({ ...cardForm, due_day: e.target.value })} /></FormField>
          <FormField label="Minimum due"><input className="input" type="number" value={cardForm.minimum_due} onChange={(e) => setCardForm({ ...cardForm, minimum_due: e.target.value })} /></FormField>
          <FormField label="Linked UPI apps"><input className="input" value={cardForm.linked_upi_apps} onChange={(e) => setCardForm({ ...cardForm, linked_upi_apps: e.target.value })} placeholder="Google Pay, PhonePe" /></FormField>
          <FormField label="Notes"><input className="input" value={cardForm.notes} onChange={(e) => setCardForm({ ...cardForm, notes: e.target.value })} /></FormField>
          <button className="btn md:col-span-2"><Plus size={16} /> Add Card</button>
        </form>
      </Panel>
      <Panel title="Add Card Transaction">
        <form onSubmit={saveTransaction} className="grid gap-3 md:grid-cols-2">
          <FormField label="Date"><input className="input" type="date" value={txForm.transaction_date} onChange={(e) => setTxForm({ ...txForm, transaction_date: e.target.value })} /></FormField>
          <FormField label="Merchant"><input required className="input" value={txForm.merchant} onChange={(e) => setTxForm({ ...txForm, merchant: e.target.value })} /></FormField>
          <FormField label="Amount"><input required className="input" type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} /></FormField>
          <FormField label="Category"><select className="input" value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></FormField>
          <FormField label="Payment source"><select className="input" value={txForm.payment_source} onChange={(e) => setTxForm({ ...txForm, payment_source: e.target.value })}>{paymentSources.map((item) => <option key={item}>{item}</option>)}</select></FormField>
          <FormField label="Type"><select className="input" value={txForm.transaction_type} onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}><option>Purchase</option><option>Bill Payment</option></select></FormField>
          {['Direct Credit Card', 'UPI via RuPay Credit Card'].includes(txForm.payment_source) && <FormField label="Credit card"><select required className="input" value={txForm.credit_card_id} onChange={(e) => setTxForm({ ...txForm, credit_card_id: e.target.value })}><option value="">Select card</option>{cards.data.map((card) => <option value={card.id} key={card.id}>{card.card_name} {card.last4 ? `••${card.last4}` : ''}</option>)}</select></FormField>}
          {['UPI app', 'UPI via RuPay Credit Card'].includes(txForm.payment_source) && <FormField label="UPI app"><select className="input" value={txForm.payment_app_id} onChange={(e) => setTxForm({ ...txForm, payment_app_id: e.target.value })}><option value="">Select UPI app</option>{apps.data.map((app) => <option value={app.id} key={app.id}>{app.name}</option>)}</select></FormField>}
          {['Cash', 'Bank account'].includes(txForm.payment_source) && <FormField label="Account"><select className="input" value={txForm.account_id} onChange={(e) => setTxForm({ ...txForm, account_id: e.target.value })}><option value="">Select account</option>{accounts.data.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></FormField>}
          <FormField label="Notes"><input className="input" value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} /></FormField>
          <button className="btn md:col-span-2"><Plus size={16} /> Save Transaction</button>
        </form>
      </Panel>
    </div>
    <Panel title="Credit Card Transactions"><DataTable rows={transactions.data} columns={['transaction_date', 'merchant', 'amount', 'payment_source', 'credit_card_name']} /></Panel>
  </div>;
}

function Loans() {
  const { data, load } = useData('/loans/summary/all', []);
  const accounts = useData('/accounts', []);
  const [pay, setPay] = useState({});
  const [selectedLoan, setSelectedLoan] = useState(null);
  const fields = [['loan_name', 'text', 'Loan name'], ['loan_type', 'text', 'Loan type'], ['total_amount', 'number', 'Total amount'], ['emi_amount', 'number', 'EMI amount'], ['start_date', 'date', 'Start date'], ['end_date', 'date', 'End date'], ['interest_rate', 'number', 'Interest %'], ['lender', 'text', 'Lender/bank'], ['account_id', 'select', 'Account', accounts.data.map((a) => [a.id, a.name])], ['due_day', 'number', 'EMI deduction day'], ['notes', 'text', 'Notes']];
  async function markPaid(loan, date, amount) {
    await api(`/loans/${loan.id}/pay`, { method: 'POST', body: JSON.stringify({ payment_date: date || pay[loan.id]?.date || iso(), amount: amount || pay[loan.id]?.amount || loan.emi_amount, account_id: loan.account_id, notes: 'Marked paid' }) });
    load();
  }
  return <>
    <CrudPage title="EMI / Loan Tracker" table="loans" rows={data} load={load} fields={fields} initial={{ loan_name: '', loan_type: 'Personal', total_amount: '', emi_amount: '', start_date: iso(), end_date: iso(), interest_rate: '', lender: '', account_id: '', due_day: 5, notes: '' }}
      extra={<LoanPortfolioSummary loans={data} />}
      renderExtraRow={(loan) => <LoanRowInsights loan={loan} pay={pay[loan.id]} onPayChange={(next) => setPay({ ...pay, [loan.id]: { ...pay[loan.id], ...next } })} onPaid={() => markPaid(loan)} onOpen={() => setSelectedLoan(loan)} />} />
    {selectedLoan && <LoanInsightModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} onPaid={(date, amount) => markPaid(selectedLoan, date, amount)} />}
  </>;
}

function LoanPortfolioSummary({ loans }) {
  const totals = loans.reduce((acc, loan) => {
    const insight = loanInsights(loan);
    acc.total += Number(loan.total_amount || 0);
    acc.paid += Number(loan.total_paid || 0);
    acc.remaining += Number(loan.remaining_amount || 0);
    acc.monthly += Number(loan.emi_amount || 0);
    acc.interest += insight.estimatedInterest;
    return acc;
  }, { total: 0, paid: 0, remaining: 0, monthly: 0, interest: 0 });
  return <Panel title="Loan Portfolio">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Loan Principal" value={money(totals.total)} Icon={Landmark} color="bg-[#4d5588]" />
      <Stat label="Paid Till Now" value={money(totals.paid)} Icon={IndianRupee} color="bg-mint" />
      <Stat label="Remaining" value={money(totals.remaining)} Icon={WalletCards} color="bg-coral" />
      <Stat label="Monthly EMI" value={money(totals.monthly)} Icon={CreditCard} color="bg-saffron" />
    </div>
  </Panel>;
}

function LoanRowInsights({ loan, pay, onPayChange, onPaid, onOpen }) {
  const insight = loanInsights(loan);
  return <div className="mt-3 space-y-3 text-sm">
    <div className="grid gap-2 sm:grid-cols-4">
      <span>Paid: {loan.emis_paid} EMIs</span>
      <span>Total: {money(loan.total_paid)}</span>
      <span>Left: {loan.remaining_emi_count} EMIs</span>
      <span>Progress: {insight.paidPercent}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full bg-mint" style={{ width: `${insight.paidPercent}%` }} />
    </div>
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
      <input className="input" type="date" value={pay?.date || insight.nextDueDate || iso()} onChange={(e) => onPayChange({ date: e.target.value })} />
      <input className="input" type="number" placeholder="Amount" value={pay?.amount || ''} onChange={(e) => onPayChange({ amount: e.target.value })} />
      <button onClick={onPaid} className="btn">Mark Paid</button>
      <button onClick={onOpen} className="icon-btn text-coral">View infographic</button>
    </div>
  </div>;
}

function LoanInsightModal({ loan, onClose, onPaid }) {
  const insight = loanInsights(loan);
  const pieData = [
    { name: 'Paid', value: insight.totalPaid },
    { name: 'Remaining', value: insight.remaining }
  ];
  const costData = [
    { name: 'Principal', value: insight.principal },
    { name: 'Interest', value: insight.estimatedInterest }
  ];
  const enteredDifference = insight.calculatedEmi ? Number(loan.emi_amount || 0) - insight.calculatedEmi : 0;
  return <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/45 px-3 py-6 md:px-6" role="dialog" aria-modal="true">
    <section className="mx-auto max-w-6xl rounded-[1.5rem] bg-paper shadow-phone">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-[1.5rem] border-b border-stone-200 bg-white p-4 md:p-5">
        <div>
          <p className="text-sm font-semibold text-coral">Loan infographic</p>
          <h2 className="text-2xl font-bold">{loan.loan_name}</h2>
          <p className="text-sm text-stone-500">{loan.lender || 'Lender not set'} • EMI deduction day {loan.due_day || '-'}</p>
        </div>
        <button className="icon-btn h-10 w-10 px-0" onClick={onClose} title="Close"><X size={18} /></button>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[.85fr_1.15fr] md:p-5">
        <Panel title="Repayment Progress">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <ProgressRing percent={insight.paidPercent} label="Paid" />
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Paid amount" value={money(insight.totalPaid)} tone="text-mint" />
              <Metric label="Remaining" value={money(insight.remaining)} tone="text-coral" />
              <Metric label="EMIs paid" value={`${loan.emis_paid || 0}`} />
              <Metric label="EMIs left" value={`${loan.remaining_emi_count || 0}`} />
            </div>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82}>{pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#36b7a0' : '#ff4f45'} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Exact EMI Calculator">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Principal" value={money(insight.principal)} />
            <Metric label="Interest rate" value={`${Number(loan.interest_rate || 0)}% p.a.`} />
            <Metric label="Tenure" value={`${insight.tenureMonths} months`} />
            <Metric label="Calculated EMI" value={money(insight.calculatedEmi)} tone="text-coral" />
            <Metric label="Entered EMI" value={money(loan.emi_amount)} />
            <Metric label="Difference" value={money(enteredDifference)} tone={enteredDifference >= 0 ? 'text-mint' : 'text-coral'} />
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Total repayment estimate</p>
                <p className="text-xs text-stone-500">Based on reducing-balance EMI formula</p>
              </div>
              <b>{money(insight.totalPayable)}</b>
            </div>
            <div className="h-56">
              <ResponsiveContainer><BarChart data={costData}><CartesianGrid strokeDasharray="3 3" stroke="#f1e4e2" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="value" fill="#ff4f45" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <Panel title="Timeline & Payment Action">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Start date" value={dateIn(loan.start_date)} />
            <Metric label="End date" value={dateIn(loan.end_date)} />
            <Metric label="Next deduction" value={insight.nextDueDate ? dateIn(insight.nextDueDate) : 'All caught up'} tone="text-coral" />
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
            <input className="input" type="date" defaultValue={insight.nextDueDate || iso()} id={`paid-date-${loan.id}`} />
            <input className="input" type="number" defaultValue={loan.emi_amount || insight.calculatedEmi || ''} id={`paid-amount-${loan.id}`} />
            <button className="btn" onClick={() => onPaid(document.getElementById(`paid-date-${loan.id}`).value, document.getElementById(`paid-amount-${loan.id}`).value)}>Mark EMI Paid</button>
          </div>
        </Panel>

        <Panel title="Loan Notes">
          <div className="grid gap-3 md:grid-cols-2">
            <Metric label="Loan type" value={loan.loan_type || '-'} />
            <Metric label="Account" value={loan.account_name || '-'} />
          </div>
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-stone-600">{loan.notes || 'No notes added.'}</p>
        </Panel>
      </div>
    </section>
  </div>;
}

function Metric({ label, value, tone = 'text-ink' }) {
  return <div className="rounded-2xl border border-stone-100 bg-white p-3">
    <p className="text-xs font-medium text-stone-500">{label}</p>
    <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
  </div>;
}

function ProgressRing({ percent, label }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  return <div className="grid place-items-center">
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f1f1" strokeWidth="16" />
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#36b7a0" strokeWidth="16" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><p className="text-3xl font-bold">{percent}%</p><p className="text-sm text-stone-500">{label}</p></div>
      </div>
    </div>
  </div>;
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
  return <div className="space-y-4 md:space-y-6">
    <ReportShowcase data={data} month={month} year={year} />
    <div className="grid gap-6 xl:grid-cols-2">
    <Panel title="Monthly Expense Report"><Chart data={data.byCategory || []} /></Panel>
    <Panel title="Category-wise Expense Report"><PieBlock data={data.byCategory || []} /></Panel>
    <Panel title="EMI Report"><MiniBars data={data.emi || []} /></Panel>
    <Panel title="Account-wise Report"><MiniBars data={data.byAccount || []} /></Panel>
    <Panel title="Payment App-wise Report"><MiniBars data={data.byPaymentApp || []} /></Panel>
    <Panel title="Credit Card-wise Spending"><MiniBars data={data.byCreditCard || []} /></Panel>
    <Panel title="Card Utilization"><MiniBars data={data.cardUtilization || []} /></Panel>
    <Panel title="Payment Source Usage"><PieBlock data={data.byPaymentSource || []} /></Panel>
    <Panel title="Salary Remaining Report"><div className="grid gap-3 sm:grid-cols-2"><Stat label="Salary" value={money(data.salaryRemaining?.salary)} Icon={IndianRupee} color="bg-mint" /><Stat label="Remaining" value={money(data.salaryRemaining?.remaining)} Icon={WalletCards} color="bg-ink" /></div></Panel>
    </div>
  </div>;
}

function SettingsPage({ installPrompt, installApp, standalone }) {
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
    <Panel title="Mobile App">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-semibold">{standalone ? 'FinTrack Pro is running like a mobile app.' : 'Install FinTrack Pro on your phone home screen.'}</p>
          <p className="mt-1 text-sm text-stone-500">Chrome or Edge: open this site, tap menu, then choose Install app or Add to Home screen.</p>
        </div>
        {installPrompt
          ? <button className="btn" type="button" onClick={installApp}><Download size={16} /> Install App</button>
          : <span className="rounded-2xl bg-blush px-4 py-3 text-sm font-semibold text-coral">{standalone ? 'Installed' : 'Browser menu'}</span>}
      </div>
    </Panel>
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
        {rows.map((row) => <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm md:rounded-2xl md:p-4" key={row.id}>
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
  if (type === 'checkbox') return <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm"><input type="checkbox" checked={!!Number(value)} onChange={(e) => onChange(e.target.checked ? 1 : 0)} /> {label}</label>;
  if (type === 'select') return <label className="text-sm font-medium">{label}<select required className="input mt-1" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">Select</option>{options.map((o) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}</select></label>;
  return <label className="text-sm font-medium">{label}<input required={['amount', 'date', 'name', 'title'].some((part) => name.includes(part))} className="input mt-1" type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function TransactionHeader({ rows, month, year, filters, setFilters, accounts, apps }) {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return <div className="space-y-4">
    <section className="overflow-hidden rounded-[1.25rem] bg-white shadow-soft md:rounded-[2rem]">
      <div className="bg-coral px-4 pb-4 pt-5 text-white md:px-5 md:pb-5 md:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm opacity-80">Transaction</p>
            <h3 className="text-xl font-bold md:text-2xl">Expense</h3>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2 text-sm md:rounded-2xl">{new Date(year, month - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}</div>
        </div>
        <div className="mt-4 grid grid-cols-3 rounded-xl bg-white/15 p-2 text-center text-xs md:mt-5 md:rounded-2xl md:p-3 md:text-sm">
          <span>Daily</span><span className="rounded-lg bg-white py-1 text-coral md:rounded-xl">Monthly</span><span>Summary</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3 md:gap-3 md:p-5">
        <div className="rounded-2xl bg-blush p-3 md:p-4"><p className="text-xs font-semibold text-coral">Count</p><p className="mt-1 text-xl font-bold md:text-2xl">{rows.length}</p></div>
        <div className="rounded-2xl bg-[#f8f8f8] p-3 md:p-4"><p className="text-xs font-semibold text-stone-500">Paid</p><p className="mt-1 text-xl font-bold md:text-2xl">{money(total)}</p></div>
        <div className="rounded-2xl bg-[#f3fbf8] p-3 md:p-4"><p className="text-xs font-semibold text-mint">Avg</p><p className="mt-1 text-xl font-bold md:text-2xl">{money(rows.length ? total / rows.length : 0)}</p></div>
      </div>
    </section>
    <Filters filters={filters} setFilters={setFilters} accounts={accounts} apps={apps} />
  </div>;
}

function Filters({ filters, setFilters, accounts, apps }) {
  const active = [filters.category, filters.payment_app_id, filters.account_id].filter(Boolean).length;
  return <section className="rounded-[1.25rem] bg-[#34395f] p-3.5 text-white shadow-soft md:rounded-[1.75rem] md:p-4">
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
  return <section className="overflow-hidden rounded-[1.25rem] bg-white shadow-soft md:rounded-[2rem]">
    <div className="bg-coral px-4 py-4 text-white md:px-5 md:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm opacity-80">Stats</p>
          <h3 className="text-xl font-bold md:text-2xl">Expense Charts</h3>
        </div>
        <div className="rounded-xl bg-white/15 px-3 py-2 text-sm md:rounded-2xl md:px-4">{new Date(year, month - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}</div>
      </div>
    </div>
    <div className="grid gap-4 p-4 lg:grid-cols-[.85fr_1.15fr] md:gap-5 md:p-5">
      <div className="rounded-2xl border border-stone-100 bg-[#fafafa] p-3 md:rounded-[1.75rem] md:p-4">
        <div className="h-56 md:h-64"><ResponsiveContainer><PieChart><Pie data={category} dataKey="value" nameKey="name" outerRadius={86} label>{category.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer></div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 rounded-2xl bg-[#fafafa] p-3 text-center md:p-4">
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

function FormField({ label, children }) { return <label className="text-sm font-semibold text-slate-600"><span className="mb-1 block">{label}</span>{children}</label>; }
function Panel({ title, children, action }) { return <section className="soft-panel"><div className="mb-3 flex items-center justify-between gap-3 md:mb-4"><h3 className="text-base font-bold tracking-tight md:text-lg">{title}</h3>{action}</div>{children}</section>; }
function Stat({ label, value, Icon, color }) { return <div className="rounded-[1.25rem] border border-stone-100 bg-white p-3 shadow-soft md:rounded-[1.75rem] md:p-4"><div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${color} text-white md:mb-4 md:h-11 md:w-11 md:rounded-2xl`}><Icon size={18} /></div><p className="text-xs font-medium text-stone-500 md:text-sm">{label}</p><p className="mt-1 break-words text-xl font-bold tracking-tight md:text-2xl">{value}</p></div>; }
function List({ rows, render }) { return <div className="space-y-2">{rows.map((row, i) => <div className="transaction-row flex flex-col gap-1 text-sm" key={row.id || i}>{render(row)}</div>)} {!rows.length && <p className="py-4 text-sm text-stone-500">Nothing to show.</p>}</div>; }
function EmptyState({ title, message }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><Sparkles className="mx-auto text-coral" /><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm text-slate-500">{message}</p></div>; }
function SetupMissing({ title, message }) { return <div className="grid min-h-[50vh] place-items-center"><section className="max-w-lg rounded-3xl bg-white p-6 text-center shadow-phone"><AlertTriangle className="mx-auto text-saffron" size={34} /><h2 className="mt-3 text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-slate-600">{message}</p></section></div>; }
function DataTable({ rows, columns }) { return <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">{columns.map((column) => <th className="px-3 py-2" key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-slate-100" key={row.id}>{columns.map((column) => <td className="px-3 py-3" key={column}>{column.includes('amount') ? money(row[column]) : column.includes('date') ? dateIn(row[column]) : row[column] || '-'}</td>)}</tr>)}</tbody></table>{!rows.length && <EmptyState title="No records" message="Add a record to see it here." />}</div>; }
function AIInsightsPanel({ insights }) { return <Panel title="AI Insights" action={<span className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-coral">Local AI</span>}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{insights.map((item) => <div className={`rounded-2xl border p-3 ${item.severity === 'danger' ? 'border-red-100 bg-red-50 text-red-700' : item.severity === 'warning' ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-indigo-100 bg-indigo-50 text-indigo-800'}`} key={item.id}><div className="mb-2 flex items-center gap-2 font-bold">{item.severity === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{item.title}</div><p className="text-sm">{item.message}</p></div>)}{!insights.length && <p className="text-sm text-slate-500">No insights yet. Add transactions to generate local AI-style analysis.</p>}</div></Panel>; }
function CreditCardWidget({ card }) { const pct = cardUtilization(card); const color = pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-saffron' : 'bg-mint'; return <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-5 text-white shadow-phone"><div className="flex items-start justify-between"><div><p className="text-sm text-white/65">{card.bank_name}</p><h3 className="text-xl font-bold">{card.card_name}</h3></div><CreditCard /></div><div className="mt-6 flex items-end justify-between"><p className="font-mono text-lg tracking-widest">•••• {card.last4 || '----'}</p><span className="rounded-full bg-white/15 px-3 py-1 text-xs">{card.network}</span></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs text-white/70"><span>Used {money(card.used_limit)}</span><span>{pct}%</span></div><div className="h-2 rounded-full bg-white/15"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} /></div></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-white/55">Available</p><b>{money(Number(card.credit_limit || 0) - Number(card.used_limit || 0))}</b></div><div><p className="text-white/55">Due day</p><b>{card.due_day}</b></div></div></article>; }
function Chart({ data }) { return <div className="h-60 md:h-72"><ResponsiveContainer><AreaChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#f1e4e2" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Area type="monotone" dataKey="value" stroke="#ff4f45" fill="#ffe1df" /></AreaChart></ResponsiveContainer></div>; }
function MiniBars({ data }) { return <div className="h-60 md:h-72"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#f1e4e2" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="value" fill="#ff4f45" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>; }
function PieBlock({ data }) { return <div className="h-60 md:h-72"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer></div>; }
function iso() { return new Date().toISOString().slice(0, 10); }
function loanInsights(loan) {
  const principal = Number(loan.total_amount || 0);
  const totalPaid = Number(loan.total_paid || 0);
  const remaining = Math.max(0, Number(loan.remaining_amount ?? (principal - totalPaid)));
  const tenureMonths = loanTenureMonths(loan.start_date, loan.end_date);
  const calculatedEmi = calculateEmi(principal, Number(loan.interest_rate || 0), tenureMonths);
  const totalPayable = calculatedEmi * tenureMonths;
  const estimatedInterest = Math.max(0, totalPayable - principal);
  const paidPercent = principal > 0 ? Math.min(100, Math.round((totalPaid / principal) * 100)) : 0;
  return {
    principal,
    totalPaid,
    remaining,
    tenureMonths,
    calculatedEmi,
    totalPayable,
    estimatedInterest,
    paidPercent,
    nextDueDate: nextLoanDueDate(loan)
  };
}
function summarizeCards(cards = [], transactions = []) {
  const totalLimit = cards.reduce((sum, card) => sum + Number(card.credit_limit || 0), 0);
  const usedLimit = cards.reduce((sum, card) => sum + Number(card.used_limit || 0), 0);
  const currentMonthSpend = transactions.filter((row) => row.transaction_type !== 'Bill Payment').reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return { totalLimit, usedLimit, availableLimit: Math.max(0, totalLimit - usedLimit), currentMonthSpend };
}
function cardUtilization(card) {
  return Number(card?.credit_limit || 0) > 0 ? Math.round((Number(card.used_limit || 0) / Number(card.credit_limit || 0)) * 100) : 0;
}
function creditCardInsights(cards = [], transactions = []) {
  const insights = [];
  cards.forEach((card) => {
    const pct = cardUtilization(card);
    if (pct >= 80) insights.push({ id: `util-${card.id}`, title: 'High utilization', message: `${card.card_name} is at ${pct}% utilization. Pay down the bill to protect available credit.`, severity: 'danger' });
    else if (pct >= 50) insights.push({ id: `util-${card.id}`, title: 'Moderate utilization', message: `${card.card_name} is at ${pct}% utilization. Keep it below 50% for safer cash flow.`, severity: 'warning' });
    if (daysUntil(nextDueDate(card.due_day)) <= 7) insights.push({ id: `due-${card.id}`, title: 'Bill due soon', message: `${card.card_name} payment is due on ${dateIn(nextDueDate(card.due_day))}.`, severity: 'warning' });
  });
  const rupayCount = transactions.filter((row) => row.payment_source === 'UPI via RuPay Credit Card').length;
  if (rupayCount) insights.push({ id: 'rupay-usage', title: 'RuPay UPI usage', message: `UPI via RuPay card used ${rupayCount} time${rupayCount === 1 ? '' : 's'} this month.`, severity: 'ok' });
  return insights;
}
function dashboardInsights(data = {}) {
  const insights = [];
  if (Number(data.remaining || 0) < 0) insights.push({ id: 'balance-negative', title: 'Balance warning', message: `Your current month balance is negative by ${money(Math.abs(data.remaining))}.`, severity: 'danger' });
  const salary = Number(data.salary || 0);
  if (salary > 0) {
    const savingsRate = Math.round((Number(data.remaining || 0) / salary) * 100);
    insights.push({ id: 'savings-rate', title: 'Savings rate', message: `Estimated savings rate this month is ${savingsRate}%.`, severity: savingsRate < 10 ? 'warning' : 'ok' });
    const emiBurden = Math.round((Number(data.emiPaid || 0) / salary) * 100);
    if (emiBurden > 35) insights.push({ id: 'emi-burden', title: 'EMI burden high', message: `EMI burden is ${emiBurden}% of monthly income.`, severity: 'warning' });
  }
  (data.creditCardSummary?.warnings || []).forEach((item) => insights.push(item));
  const upcomingEmi = (data.emiReminders || [])[0];
  if (upcomingEmi) insights.push({ id: 'next-emi', title: 'Next EMI', message: `${upcomingEmi.loan_name} is due on ${dateIn(upcomingEmi.due_date)}.`, severity: daysUntil(upcomingEmi.due_date) <= 3 ? 'warning' : 'ok' });
  return insights.slice(0, 6);
}
function buildNotifications(data) {
  const items = [];
  if (Number(data.remaining || 0) < 0) items.push({ id: 'negative-balance', title: 'Negative balance', message: `This month balance is ${money(data.remaining)}.`, severity: 'danger' });
  (data.emiReminders || []).forEach((emi) => { if (daysUntil(emi.due_date) <= 7) items.push({ id: `emi-${emi.id}`, title: 'EMI due soon', message: `${emi.loan_name} EMI of ${money(emi.amount)} is due on ${dateIn(emi.due_date)}.`, severity: 'warning' }); });
  (data.reminders || []).forEach((reminder) => { if (daysUntil(reminder.due_date) <= 7) items.push({ id: `reminder-${reminder.id}`, title: 'Reminder due', message: `${reminder.title} is due on ${dateIn(reminder.due_date)}.`, severity: 'warning' }); });
  (data.creditCardSummary?.warnings || []).forEach((warning) => items.push(warning));
  return items.slice(0, 12);
}
function nextDueDate(day) {
  const date = dueDateForMonth(new Date().getFullYear(), new Date().getMonth(), day || 1);
  if (date < new Date().setHours(0, 0, 0, 0)) return formatDateInput(dueDateForMonth(new Date().getFullYear(), new Date().getMonth() + 1, day || 1));
  return formatDateInput(date);
}
function loanTenureMonths(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return 0;
  return Math.max(1, ((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth()) + 1);
}
function calculateEmi(principal, annualRate, months) {
  if (!principal || !months) return 0;
  const monthlyRate = Number(annualRate || 0) / 12 / 100;
  if (!monthlyRate) return principal / months;
  const compound = (1 + monthlyRate) ** months;
  return principal * monthlyRate * compound / (compound - 1);
}
function nextLoanDueDate(loan) {
  if (!loan?.start_date || !loan?.end_date) return '';
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const start = new Date(loan.start_date);
  const end = new Date(loan.end_date);
  let cursor = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  if (cursor < new Date(start.getFullYear(), start.getMonth(), 1)) cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  for (let index = 0; index < 18; index += 1) {
    const due = dueDateForMonth(cursor.getFullYear(), cursor.getMonth(), loan.due_day || start.getDate());
    if (due >= start && due <= end && due >= todayDate) return formatDateInput(due);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return '';
}
function dueDateForMonth(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(Number(day || 1), lastDay));
}
function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function notificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
function notifyUpcomingEmis(rows, force = false) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  rows
    .filter((row) => daysUntil(row.due_date) <= 3)
    .forEach((row) => {
      const key = `fintrack-emi-notified-${row.id}-${iso()}`;
      if (!force && localStorage.getItem(key)) return;
      new Notification('FinTrack Pro EMI Reminder', {
        body: `${row.loan_name}: ${money(row.amount)} due on ${dateIn(row.due_date)}`
      });
      localStorage.setItem(key, '1');
    });
}
function daysUntil(value) {
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target - current) / 86400000));
}
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

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
