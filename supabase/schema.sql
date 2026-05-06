create table if not exists users (
  id bigserial primary key,
  name text not null,
  email text,
  created_at timestamptz default now()
);

create table if not exists salaries (
  id bigserial primary key,
  month integer not null check (month between 1 and 12),
  year integer not null,
  amount numeric not null check (amount >= 0),
  notes text,
  created_at timestamptz default now(),
  unique (month, year)
);

create table if not exists accounts (
  id bigserial primary key,
  name text not null,
  type text not null,
  opening_balance numeric not null default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists payment_apps (
  id bigserial primary key,
  name text not null,
  type text default 'Other',
  notes text,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id bigserial primary key,
  date date not null,
  amount numeric not null check (amount >= 0),
  category text not null,
  notes text,
  payment_method text not null,
  payment_app_id bigint references payment_apps(id) on delete set null,
  account_id bigint references accounts(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists loans (
  id bigserial primary key,
  loan_name text not null,
  loan_type text not null,
  total_amount numeric not null check (total_amount >= 0),
  emi_amount numeric not null check (emi_amount >= 0),
  start_date date not null,
  end_date date not null,
  interest_rate numeric,
  lender text,
  account_id bigint references accounts(id) on delete set null,
  due_day integer default 5 check (due_day between 1 and 31),
  notes text,
  created_at timestamptz default now()
);

create table if not exists emi_payments (
  id bigserial primary key,
  loan_id bigint not null references loans(id) on delete cascade,
  payment_date date not null,
  amount numeric not null check (amount >= 0),
  account_id bigint references accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists investments (
  id bigserial primary key,
  name text not null,
  type text not null,
  amount numeric not null check (amount >= 0),
  date date not null,
  account_id bigint references accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists reminders (
  id bigserial primary key,
  title text not null,
  amount numeric default 0,
  due_date date not null,
  repeat_monthly integer default 0,
  notes text,
  completed integer default 0,
  created_at timestamptz default now()
);

create table if not exists transfers (
  id bigserial primary key,
  from_account_id bigint references accounts(id) on delete set null,
  to_account_id bigint references accounts(id) on delete set null,
  amount numeric not null check (amount >= 0),
  date date not null,
  notes text,
  created_at timestamptz default now()
);

insert into users (name, email)
values ('FinTrack User', 'user@example.com')
on conflict do nothing;

insert into accounts (id, name, type, opening_balance, notes) values
  (1, 'HDFC Salary Account', 'Bank account', 85000, 'Primary salary account'),
  (2, 'Cash Wallet', 'Cash', 4500, ''),
  (3, 'UPI Wallet', 'UPI wallet', 12000, ''),
  (4, 'Axis Credit Card', 'Credit card', 0, 'Monthly bill payment')
on conflict (id) do nothing;

insert into payment_apps (id, name, type, notes) values
  (1, 'Google Pay', 'UPI', ''),
  (2, 'PhonePe', 'UPI', ''),
  (3, 'Credit Card App', 'Card', '')
on conflict (id) do nothing;

insert into salaries (month, year, amount, notes)
values (5, 2026, 120000, 'Sample May salary')
on conflict (month, year) do nothing;

insert into expenses (date, amount, category, notes, payment_method, payment_app_id, account_id) values
  ('2026-05-01', 18000, 'Rent', 'Monthly rent', 'UPI', 1, 1),
  ('2026-05-02', 850, 'Food', 'Groceries', 'UPI', 2, 3),
  ('2026-05-03', 2200, 'Travel', 'Fuel', 'Card', 3, 4),
  ('2026-05-04', 1400, 'Bills', 'Internet bill', 'UPI', 1, 1);

insert into loans (id, loan_name, loan_type, total_amount, emi_amount, start_date, end_date, interest_rate, lender, account_id, due_day, notes)
values (1, 'Home Loan', 'Home', 2500000, 32000, '2024-01-05', '2034-01-05', 8.5, 'SBI', 1, 5, 'Sample loan')
on conflict (id) do nothing;

insert into emi_payments (loan_id, payment_date, amount, account_id, notes)
values (1, '2026-05-05', 32000, 1, 'May EMI');

insert into investments (name, type, amount, date, account_id, notes)
values ('Nifty 50 SIP', 'SIP', 10000, '2026-05-06', 1, 'Monthly SIP');

insert into reminders (title, amount, due_date, repeat_monthly, notes, completed)
values ('Credit card bill', 12000, '2026-05-18', 1, 'Pay before due date', 0);

insert into transfers (from_account_id, to_account_id, amount, date, notes)
values (1, 2, 5000, '2026-05-02', 'ATM withdrawal');

select setval(pg_get_serial_sequence('accounts', 'id'), coalesce((select max(id) from accounts), 1), true);
select setval(pg_get_serial_sequence('payment_apps', 'id'), coalesce((select max(id) from payment_apps), 1), true);
select setval(pg_get_serial_sequence('loans', 'id'), coalesce((select max(id) from loans), 1), true);
