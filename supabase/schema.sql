-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
-- Note: Supabase handles auth in auth.users. This public.users table is for app-specific profile data.
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

-- Enable RLS for users
alter table public.users enable row level security;

-- Create policy to allow users to read their own data
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

-- Create policy to allow admin to read all data (Temporary simple policy, can be specific later)
-- Note: 'is_admin' check would typically require a function or claim. For MVP, we might keep it simple.
create policy "Admins can view all data" on public.users
  for select using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));


-- CATEGORIES TABLE (Managed by Admin)
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

-- Everyone can read categories
create policy "Everyone can view categories" on public.categories
  for select using (true);


-- Q&A TABLE
create table if not exists public.qa (
  id uuid default uuid_generate_v4() primary key,
  question_title text not null,
  question_content text not null,
  answer_content text not null,
  category_id uuid references public.categories(id),
  is_published boolean default true,
  is_free boolean default false,
  sort_order integer default 0,
  search_vector tsvector,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for sort order
create index if not exists idx_qa_sort_order on public.qa(sort_order);

-- GIN index for full-text search
create index if not exists idx_qa_search on public.qa using GIN(search_vector);

alter table public.qa enable row level security;

-- Access control for Q&A:
-- 1. Must be logged in
-- 2. Must have active subscription (logic handled in app usually, but can be done here with complex policies)
-- For MVP DB policy: Allow read if authenticated. App logic will enforce subscription check before fetching or showing.
create policy "Authenticated users can view QA" on public.qa
  for select using (auth.role() = 'authenticated');


-- SUBSCRIPTIONS TABLE
-- Maps Stripe subscriptions to users
create table if not exists public.subscriptions (
  id text primary key, -- Stripe Subscription ID
  user_id uuid references public.users(id) not null,
  status text not null, -- 'active', 'canceled', 'past_due', etc.
  price_id text,
  cancel_at_period_end boolean default false,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscriptions enable row level security;

-- Users can accept their own subscription
create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- TRIGGER to handle new user creation (Optional but helpful)
-- inserts a row into public.users when a new user signs up via Supabase Auth
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


-- ===========================================
-- FULL-TEXT SEARCH TRIGGER FOR Q&A
-- ===========================================

-- Function to auto-update search_vector on Q&A insert/update
create or replace function qa_search_trigger() returns trigger as $$
begin
  NEW.search_vector := 
    setweight(to_tsvector('simple', coalesce(NEW.question_title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.question_content, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.answer_content, '')), 'C');
  return NEW;
end;
$$ language plpgsql;

-- Trigger to auto-update search_vector
create trigger qa_search_update
  before insert or update on public.qa
  for each row
  execute function qa_search_trigger();


-- ===========================================
-- SEARCH FUNCTION FOR Q&A (Optional but useful)
-- ===========================================

-- Search function with ranking support
create or replace function search_qa(search_term text)
returns table (
  id uuid,
  question_title text,
  question_content text,
  answer_content text,
  category_id uuid,
  is_published boolean,
  is_free boolean,
  sort_order integer,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
) as $$
begin
  return query
  select 
    qa.id,
    qa.question_title,
    qa.question_content,
    qa.answer_content,
    qa.category_id,
    qa.is_published,
    qa.is_free,
    qa.sort_order,
    qa.created_at,
    qa.updated_at,
    ts_rank(qa.search_vector, plainto_tsquery('simple', search_term)) +
    case when qa.question_title ilike '%' || search_term || '%' then 0.5 else 0 end +
    case when qa.question_content ilike '%' || search_term || '%' then 0.3 else 0 end as rank
  from public.qa
  where 
    qa.search_vector @@ plainto_tsquery('simple', search_term)
    or qa.question_title ilike '%' || search_term || '%'
    or qa.question_content ilike '%' || search_term || '%'
    or qa.answer_content ilike '%' || search_term || '%'
  order by rank desc, qa.sort_order asc, qa.created_at desc;
end;
$$ language plpgsql;