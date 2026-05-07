create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.salaries (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null,
  amount numeric not null check (amount >= 0),
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.accounts (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  opening_balance numeric not null default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.payment_apps (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text default 'Other',
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.expenses (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  amount numeric not null check (amount >= 0),
  category text not null,
  notes text,
  payment_method text not null,
  payment_app_id bigint references public.payment_apps(id) on delete set null,
  account_id bigint references public.accounts(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.loans (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  loan_name text not null,
  loan_type text not null,
  total_amount numeric not null check (total_amount >= 0),
  emi_amount numeric not null check (emi_amount >= 0),
  start_date date not null,
  end_date date not null,
  interest_rate numeric,
  lender text,
  account_id bigint references public.accounts(id) on delete set null,
  due_day integer default 5 check (due_day between 1 and 31),
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.emi_payments (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  loan_id bigint not null references public.loans(id) on delete cascade,
  payment_date date not null,
  amount numeric not null check (amount >= 0),
  account_id bigint references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.investments (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  amount numeric not null check (amount >= 0),
  date date not null,
  account_id bigint references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.reminders (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  amount numeric default 0,
  due_date date not null,
  repeat_monthly integer default 0,
  notes text,
  completed integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.transfers (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  from_account_id bigint references public.accounts(id) on delete set null,
  to_account_id bigint references public.accounts(id) on delete set null,
  amount numeric not null check (amount >= 0),
  date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.salaries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.accounts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.payment_apps add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.expenses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.loans add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.emi_payments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.investments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.reminders add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.transfers add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists salaries_user_month_year_idx on public.salaries(user_id, month, year);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists(select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, email, role, status)
  values (
    new.id,
    new.email,
    case when is_first_user then 'admin' else 'user' end,
    case when is_first_user then 'approved' else 'pending' end
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.salaries enable row level security;
alter table public.accounts enable row level security;
alter table public.payment_apps enable row level security;
alter table public.expenses enable row level security;
alter table public.loans enable row level security;
alter table public.emi_payments enable row level security;
alter table public.investments enable row level security;
alter table public.reminders enable row level security;
alter table public.transfers enable row level security;

drop policy if exists "Users view own profile or admins view all" on public.profiles;
drop policy if exists "Users create own profile" on public.profiles;
drop policy if exists "Admins update profiles" on public.profiles;
drop policy if exists "Users manage own salaries" on public.salaries;
drop policy if exists "Users manage own accounts" on public.accounts;
drop policy if exists "Users manage own payment apps" on public.payment_apps;
drop policy if exists "Users manage own expenses" on public.expenses;
drop policy if exists "Users manage own loans" on public.loans;
drop policy if exists "Users manage own emi payments" on public.emi_payments;
drop policy if exists "Users manage own investments" on public.investments;
drop policy if exists "Users manage own reminders" on public.reminders;
drop policy if exists "Users manage own transfers" on public.transfers;

create policy "Users view own profile or admins view all"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Users create own profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "Admins update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

create policy "Users manage own salaries" on public.salaries for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own accounts" on public.accounts for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own payment apps" on public.payment_apps for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own expenses" on public.expenses for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own loans" on public.loans for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own emi payments" on public.emi_payments for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own investments" on public.investments for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own reminders" on public.reminders for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own transfers" on public.transfers for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
