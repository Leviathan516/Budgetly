-- Run this in your Supabase SQL Editor to set up the database

-- Transactions table (purchases and income)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount decimal(10,2) not null,
  description text not null,
  category text not null default 'other',
  type text not null check (type in ('expense', 'income')),
  date date not null default current_date,
  receipt_url text,
  created_at timestamp with time zone default now()
);

-- Recurring income/expenses (paydays, rent, subscriptions)
create table if not exists recurring (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount decimal(10,2) not null,
  description text not null,
  category text not null default 'other',
  type text not null check (type in ('expense', 'income')),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  next_date date not null,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_transactions_user_date on transactions(user_id, date desc);
create index if not exists idx_recurring_user_active on recurring(user_id, active);

-- Row Level Security
alter table transactions enable row level security;
alter table recurring enable row level security;

-- Policies: users only see their own data
create policy "Users view own transactions" on transactions
  for select using (auth.uid() = user_id);
create policy "Users insert own transactions" on transactions
  for insert with check (auth.uid() = user_id);
create policy "Users update own transactions" on transactions
  for update using (auth.uid() = user_id);
create policy "Users delete own transactions" on transactions
  for delete using (auth.uid() = user_id);

create policy "Users view own recurring" on recurring
  for select using (auth.uid() = user_id);
create policy "Users insert own recurring" on recurring
  for insert with check (auth.uid() = user_id);
create policy "Users update own recurring" on recurring
  for update using (auth.uid() = user_id);
create policy "Users delete own recurring" on recurring
  for delete using (auth.uid() = user_id);
