-- Admin content management: all write paths are gated by trusted app_metadata.role.
create or replace function public.is_kotoba_admin()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_kotoba_admin() from public;
grant execute on function public.is_kotoba_admin() to authenticated;

drop policy if exists "admins read all languages" on public.languages;
create policy "admins read all languages" on public.languages for select to authenticated using (public.is_kotoba_admin());
drop policy if exists "admins read all characters" on public.characters;
create policy "admins read all characters" on public.characters for select to authenticated using (public.is_kotoba_admin());
drop policy if exists "admins read all courses" on public.courses;
create policy "admins read all courses" on public.courses for select to authenticated using (public.is_kotoba_admin());
drop policy if exists "admins read all units" on public.units;
create policy "admins read all units" on public.units for select to authenticated using (public.is_kotoba_admin());
drop policy if exists "admins read all lessons" on public.lessons;
create policy "admins read all lessons" on public.lessons for select to authenticated using (public.is_kotoba_admin());
drop policy if exists "admins read all questions" on public.lesson_questions;
create policy "admins read all questions" on public.lesson_questions for select to authenticated using (public.is_kotoba_admin());
drop policy if exists "admins read all achievements" on public.achievements;
create policy "admins read all achievements" on public.achievements for select to authenticated using (public.is_kotoba_admin());
drop policy if exists "admins read all daily quests" on public.daily_quests;
create policy "admins read all daily quests" on public.daily_quests for select to authenticated using (public.is_kotoba_admin());

grant insert, update, delete on public.languages, public.characters, public.courses, public.units, public.lessons, public.lesson_questions, public.achievements, public.daily_quests to authenticated;

do $$
declare t text;
begin
  foreach t in array array['languages','characters','courses','units','lessons','lesson_questions','achievements','daily_quests'] loop
    execute format('drop policy if exists %I on public.%I', 'admins insert '||t, t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_kotoba_admin())', 'admins insert '||t, t);
    execute format('drop policy if exists %I on public.%I', 'admins update '||t, t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_kotoba_admin()) with check (public.is_kotoba_admin())', 'admins update '||t, t);
    execute format('drop policy if exists %I on public.%I', 'admins delete '||t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_kotoba_admin())', 'admins delete '||t, t);
  end loop;
end $$;
