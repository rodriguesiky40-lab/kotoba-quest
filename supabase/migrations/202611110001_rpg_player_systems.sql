-- Persistent player systems for Kotoba Quest RPG.
-- No balances or rewards are client-editable through these tables.

create table if not exists public.user_game_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  character_class text not null default 'word_mage' check (character_class in ('word_mage','kanji_guardian','spirit_bard')),
  avatar_config jsonb not null default '{}'::jsonb,
  unlocked_skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  quantity integer not null default 1 check (quantity > 0),
  equipped_slot text,
  acquired_at timestamptz not null default now(),
  unique(user_id,item_key)
);

create table if not exists public.user_srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language_code text not null references public.languages(code),
  front text not null,
  back text not null,
  furigana text,
  notes text,
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_srs_due_idx on public.user_srs_cards(user_id,next_review_at);
create index if not exists user_srs_language_idx on public.user_srs_cards(user_id,language_code);

create table if not exists public.user_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language_code text not null references public.languages(code),
  exercise_id uuid,
  prompt text not null,
  user_answer text not null,
  correct_answer text not null,
  explanation text,
  mistake_count integer not null default 1 check (mistake_count > 0),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_mistakes_open_idx on public.user_mistakes(user_id,language_code,created_at desc) where resolved_at is null;

alter table public.user_game_profiles enable row level security;
alter table public.user_inventory enable row level security;
alter table public.user_srs_cards enable row level security;
alter table public.user_mistakes enable row level security;

drop policy if exists "players manage own game profile" on public.user_game_profiles;
create policy "players manage own game profile" on public.user_game_profiles
  for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists "players read own inventory" on public.user_inventory;
create policy "players read own inventory" on public.user_inventory
  for select to authenticated using ((select auth.uid())=user_id);

drop policy if exists "players read own srs cards" on public.user_srs_cards;
create policy "players read own srs cards" on public.user_srs_cards
  for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "players add own srs cards" on public.user_srs_cards;
create policy "players add own srs cards" on public.user_srs_cards
  for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "players update own srs cards" on public.user_srs_cards;
create policy "players update own srs cards" on public.user_srs_cards
  for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "players delete own srs cards" on public.user_srs_cards;
create policy "players delete own srs cards" on public.user_srs_cards
  for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "players read own mistakes" on public.user_mistakes;
create policy "players read own mistakes" on public.user_mistakes
  for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "players add own mistakes" on public.user_mistakes;
create policy "players add own mistakes" on public.user_mistakes
  for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "players update own mistakes" on public.user_mistakes;
create policy "players update own mistakes" on public.user_mistakes
  for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

grant select, insert, update, delete on public.user_game_profiles to authenticated;
grant select on public.user_inventory to authenticated;
grant select, insert, update, delete on public.user_srs_cards to authenticated;
grant select, insert, update on public.user_mistakes to authenticated;

