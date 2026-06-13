-- Family Cabin: Schema + RLS
-- Run: supabase db push

create type tier_enum as enum ('family', 'friends', 'public');
create type booking_status as enum ('pending', 'confirmed', 'cancelled');

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  tier tier_enum not null default 'public',
  member_since date not null default current_date,
  emergency_contact_name text,
  emergency_contact_phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  guest_adults integer not null default 1,
  guest_children integer not null default 0,
  host_note text,
  status booking_status not null default 'pending',
  tier_at_booking tier_enum not null,
  title text not null,
  created_at timestamptz not null default now(),
  constraint valid_dates check (end_date > start_date)
);

-- Co-op items
create table if not exists coop_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  subtitle text,
  claimed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Guest notes (guestbook)
create table if not exists guest_notes (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  title text not null,
  body text not null,
  note_date date not null default current_date
);

-- Inventory (read-only staples)
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  detail text not null,
  icon text not null default '📦'
);

-- Memoirs
create table if not exists memoirs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  memoir_date date not null,
  photo_count integer not null default 0
);

-- Admin blocks
create table if not exists admin_blocks (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text not null default 'Admin Block',
  constraint valid_block_dates check (end_date >= start_date)
);

-- Rates
create table if not exists rates (
  id uuid primary key default gen_random_uuid(),
  tier tier_enum not null unique,
  nightly_rate numeric(10,2) not null default 0
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table bookings enable row level security;
alter table coop_items enable row level security;
alter table guest_notes enable row level security;
alter table inventory enable row level security;
alter table memoirs enable row level security;
alter table admin_blocks enable row level security;
alter table rates enable row level security;

-- Helper: get current user's tier
create or replace function get_my_tier()
returns tier_enum language sql security definer stable as $$
  select tier from profiles where id = auth.uid();
$$;

-- Profiles: family sees all; others see only own
create policy "profiles_select_family" on profiles
  for select using (get_my_tier() = 'family');

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- Bookings: family sees all; friends/public see only own
create policy "bookings_family_all" on bookings
  for select using (get_my_tier() = 'family');

create policy "bookings_own" on bookings
  for select using (profile_id = auth.uid());

create policy "bookings_insert_own" on bookings
  for insert with check (profile_id = auth.uid());

create policy "bookings_update_own" on bookings
  for update using (profile_id = auth.uid());

-- Co-op items: all authenticated users can see; claimant or family can update
create policy "coop_items_select" on coop_items
  for select using (auth.uid() is not null);

create policy "coop_items_update_claim" on coop_items
  for update using (
    claimed_by is null or claimed_by = auth.uid() or get_my_tier() = 'family'
  );

-- Guest notes: all authenticated can read and insert
create policy "guest_notes_select" on guest_notes
  for select using (auth.uid() is not null);

create policy "guest_notes_insert" on guest_notes
  for insert with check (auth.uid() is not null);

-- Inventory: read-only for all authenticated
create policy "inventory_select" on inventory
  for select using (auth.uid() is not null);

-- Memoirs: family sees all; others see own
create policy "memoirs_family" on memoirs
  for select using (get_my_tier() = 'family');

create policy "memoirs_own" on memoirs
  for select using (profile_id = auth.uid());

create policy "memoirs_insert" on memoirs
  for insert with check (profile_id = auth.uid());

-- Admin blocks: all authenticated can read; only family can write
create policy "admin_blocks_select" on admin_blocks
  for select using (auth.uid() is not null);

create policy "admin_blocks_family_write" on admin_blocks
  for all using (get_my_tier() = 'family');

-- Rates: all authenticated can read; only family can modify
create policy "rates_select" on rates
  for select using (auth.uid() is not null);

create policy "rates_family_write" on rates
  for all using (get_my_tier() = 'family');
