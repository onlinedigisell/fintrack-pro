alter table salaries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table accounts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table payment_apps add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table expenses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table loans add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table emi_payments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table investments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table reminders add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table transfers add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table salaries drop constraint if exists salaries_month_year_key;
alter table salaries add constraint salaries_user_month_year_key unique (user_id, month, year);

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

create policy "Users manage own salaries" on salaries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own accounts" on accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own payment apps" on payment_apps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own loans" on loans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own emi payments" on emi_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own investments" on investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own reminders" on reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own transfers" on transfers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
