create table if not exists public.credit_cards (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  card_name text not null,
  bank_name text not null,
  network text default 'RuPay',
  last4 text,
  credit_limit numeric not null default 0,
  used_limit numeric not null default 0,
  billing_start_day integer default 1,
  billing_end_day integer default 30,
  due_day integer default 20,
  minimum_due numeric default 0,
  total_due numeric default 0,
  linked_upi_apps text,
  notes text,
  active integer default 1,
  created_at timestamptz default now()
);

create table if not exists public.credit_card_transactions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  transaction_date date not null,
  merchant text not null,
  amount numeric not null check (amount >= 0),
  category text default 'Other',
  payment_source text not null,
  transaction_type text default 'Purchase',
  credit_card_id bigint references public.credit_cards(id) on delete set null,
  payment_app_id bigint references public.payment_apps(id) on delete set null,
  account_id bigint references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

alter table public.credit_cards enable row level security;
alter table public.credit_card_transactions enable row level security;

drop policy if exists "Users manage own credit cards" on public.credit_cards;
drop policy if exists "Users manage own credit card transactions" on public.credit_card_transactions;

create policy "Users manage own credit cards"
on public.credit_cards for all
using (auth.uid() = user_id and public.is_approved())
with check (auth.uid() = user_id and public.is_approved());

create policy "Users manage own credit card transactions"
on public.credit_card_transactions for all
using (auth.uid() = user_id and public.is_approved())
with check (auth.uid() = user_id and public.is_approved());
