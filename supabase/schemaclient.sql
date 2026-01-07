create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  stripe_customer_id text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Admins can view all data" on public.users
  for select using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));

create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "Everyone can view categories" on public.categories
  for select using (true);

create table if not exists public.qa (
  id uuid default uuid_generate_v4() primary key,
  question_title text not null,
  question_content text not null,
  answer_content text not null,
  category_id uuid references public.categories(id),
  is_published boolean default true,
  is_free boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.qa enable row level security;

create policy "Authenticated users can view QA" on public.qa
  for select using (auth.role() = 'authenticated');

create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references public.users(id) not null,
  status text not null,
  price_id text,
  cancel_at_period_end boolean default false,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

