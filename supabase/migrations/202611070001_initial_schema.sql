-- Kotoba Quest — initial schema
-- Apply only in a dedicated Supabase project for Kotoba Quest.
-- All user-owned tables enforce ownership with RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Aprendiz',
  avatar_url text,
  preferred_language_code text not null default 'ja',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.languages (
  code text primary key,
  name text not null,
  native_name text not null,
  flag_emoji text not null default '🌐',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  language_code text not null references public.languages(code),
  archetype text not null,
  bio text not null default '',
  avatar_url text,
  voice_id text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references public.languages(code),
  character_id uuid references public.characters(id) on delete set null,
  title text not null,
  description text not null default '',
  level text not null default 'beginner' check (level in ('beginner','elementary','intermediate','advanced')),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(course_id, sort_order)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  description text not null default '',
  lesson_type text not null default 'vocabulary'
    check (lesson_type in ('vocabulary','grammar','listening','speaking','review','checkpoint','story')),
  xp_reward integer not null default 10 check (xp_reward between 0 and 500),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(unit_id, sort_order)
);

create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  prompt text not null,
  prompt_translation text,
  question_type text not null default 'multiple_choice'
    check (question_type in ('multiple_choice','translation','listening','typing','matching')),
  options jsonb not null default '[]'::jsonb,
  answer_key text not null,
  explanation text not null default '',
  audio_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('locked','in_progress','completed')),
  best_score integer not null default 0 check (best_score between 0 and 100),
  attempts_count integer not null default 0 check (attempts_count >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  xp_earned integer not null default 0 check (xp_earned between 0 and 500),
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp bigint not null default 0 check (total_xp >= 0),
  coins bigint not null default 0 check (coins >= 0),
  hearts smallint not null default 5 check (hearts between 0 and 5),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default '⭐',
  xp_reward integer not null default 0 check (xp_reward >= 0),
  is_published boolean not null default true
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.daily_quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  goal_type text not null check (goal_type in ('complete_lessons','earn_xp','practice_minutes','correct_answers')),
  goal_value integer not null check (goal_value > 0),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  is_published boolean not null default true
);

create table if not exists public.user_daily_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.daily_quests(id) on delete cascade,
  quest_date date not null default current_date,
  progress_value integer not null default 0 check (progress_value >= 0),
  completed_at timestamptz,
  primary key (user_id, quest_id, quest_date)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  plan_code text not null check (plan_code in ('free','premium','premium_plus')),
  status text not null check (status in ('trialing','active','past_due','canceled','expired')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_language_idx on public.courses(language_code, sort_order);
create index if not exists units_course_idx on public.units(course_id, sort_order);
create index if not exists lessons_unit_idx on public.lessons(unit_id, sort_order);
create index if not exists questions_lesson_idx on public.lesson_questions(lesson_id, sort_order);
create index if not exists attempts_user_created_idx on public.lesson_attempts(user_id, created_at desc);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.languages enable row level security;
alter table public.characters enable row level security;
alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_questions enable row level security;
alter table public.user_progress enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.user_stats enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.daily_quests enable row level security;
alter table public.user_daily_quests enable row level security;
alter table public.subscriptions enable row level security;

-- Public catalog: only published learning content is visible without login.
create policy "published languages are readable" on public.languages
for select to anon, authenticated using (is_published = true);
create policy "published characters are readable" on public.characters
for select to anon, authenticated using (is_published = true);
create policy "published courses are readable" on public.courses
for select to anon, authenticated using (is_published = true);
create policy "units of published courses are readable" on public.units
for select to anon, authenticated using (
  exists (select 1 from public.courses c where c.id = course_id and c.is_published = true)
);
create policy "published lessons are readable" on public.lessons
for select to anon, authenticated using (
  is_published = true and exists (
    select 1 from public.units u join public.courses c on c.id = u.course_id
    where u.id = unit_id and c.is_published = true
  )
);
create policy "questions of published lessons are readable" on public.lesson_questions
for select to anon, authenticated using (
  exists (
    select 1 from public.lessons l join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    where l.id = lesson_id and l.is_published = true and c.is_published = true
  )
);
create policy "published achievements are readable" on public.achievements
for select to anon, authenticated using (is_published = true);
create policy "published daily quests are readable" on public.daily_quests
for select to anon, authenticated using (is_published = true);

-- A signed-in user can only read or modify their own profile and progress.
create policy "users read own profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "users create own profile" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy "users update own profile" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "users read own progress" on public.user_progress
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users insert own progress" on public.user_progress
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own progress" on public.user_progress
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users read own attempts" on public.lesson_attempts
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own attempts" on public.lesson_attempts
for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "users read own stats" on public.user_stats
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own stats" on public.user_stats
for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "users read own achievements" on public.user_achievements
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own daily quests" on public.user_daily_quests
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own daily quests" on public.user_daily_quests
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own daily quests" on public.user_daily_quests
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Subscription records are intentionally read-only to clients.
-- Only trusted server/webhook code using the service role may manage them.
create policy "users read own subscription" on public.subscriptions
for select to authenticated using ((select auth.uid()) = user_id);

grant select on public.languages, public.characters, public.courses, public.units,
  public.lessons, public.lesson_questions, public.achievements, public.daily_quests
to anon, authenticated;
grant select, insert, update on public.profiles, public.user_progress, public.user_stats,
  public.user_daily_quests to authenticated;
grant select, insert on public.lesson_attempts to authenticated;
grant select on public.user_achievements, public.subscriptions to authenticated;

insert into public.languages (code, name, native_name, flag_emoji, is_published)
values ('ja', 'Japonês', '日本語', '🇯🇵', true)
on conflict (code) do update set name = excluded.name, native_name = excluded.native_name,
  flag_emoji = excluded.flag_emoji, is_published = excluded.is_published;

insert into public.characters (slug, name, language_code, archetype, bio, is_published)
values ('aiko', 'Aiko', 'ja', 'tsundere',
  'Uma tutora determinada, inteligente e um pouco provocadora que acredita no seu potencial.', true)
on conflict (slug) do nothing;

insert into public.daily_quests (title, description, goal_type, goal_value, reward_xp)
values
  ('Primeiros passos', 'Conclua uma lição hoje.', 'complete_lessons', 1, 10),
  ('Ritmo constante', 'Ganhe 30 pontos de experiência.', 'earn_xp', 30, 15),
  ('Atenção aos detalhes', 'Acerte 5 respostas.', 'correct_answers', 5, 10)
on conflict do nothing;
