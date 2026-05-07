create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

drop policy if exists "Users view own profile or admins view all" on public.profiles;
drop policy if exists "Users create own profile" on public.profiles;
drop policy if exists "Admins update profiles" on public.profiles;

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

alter table salaries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table accounts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table payment_apps add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table expenses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table loans add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table emi_payments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table investments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table reminders add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table transfers add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table salaries enable row level security;
alter table accounts enable row level security;
alter table payment_apps enable row level security;
alter table expenses enable row level security;
alter table loans enable row level security;
alter table emi_payments enable row level security;
alter table investments enable row level security;
alter table reminders enable row level security;
alter table transfers enable row level security;

drop policy if exists "Users manage own salaries" on salaries;
drop policy if exists "Users manage own accounts" on accounts;
drop policy if exists "Users manage own payment apps" on payment_apps;
drop policy if exists "Users manage own expenses" on expenses;
drop policy if exists "Users manage own loans" on loans;
drop policy if exists "Users manage own emi payments" on emi_payments;
drop policy if exists "Users manage own investments" on investments;
drop policy if exists "Users manage own reminders" on reminders;
drop policy if exists "Users manage own transfers" on transfers;

create policy "Users manage own salaries" on salaries for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own accounts" on accounts for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own payment apps" on payment_apps for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own loans" on loans for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own emi payments" on emi_payments for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own investments" on investments for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own reminders" on reminders for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "Users manage own transfers" on transfers for all using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
