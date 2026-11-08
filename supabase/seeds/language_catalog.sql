-- Idempotent catalog seed for the five planned Kotoba Quest languages and tutors.
-- Non-Japanese languages and their tutors remain unpublished until their courses and assets are ready.
insert into public.languages (code, name, native_name, flag_emoji, is_published)
values
  ('en', 'Inglês', 'English', '🇬🇧', false),
  ('ko', 'Coreano', '한국어', '🇰🇷', false),
  ('es', 'Espanhol', 'Español', '🇪🇸', false),
  ('fr', 'Francês', 'Français', '🇫🇷', false)
on conflict (code) do nothing;

insert into public.characters (slug, name, language_code, archetype, bio, avatar_url, voice_id, is_published)
values
  ('emily', 'Emily', 'en', 'Genki girl + onee-san', 'Tutora de inglês extrovertida, confiante e brincalhona. Incentiva a conversação sem constranger o aluno.', null, null, false),
  ('hana', 'Hana', 'ko', 'Kuudere', 'Tutora de coreano calma, observadora e reservada. Demonstra cuidado com conselhos precisos e elogios discretos.', null, null, false),
  ('sofia', 'Sofía', 'es', 'Genki girl', 'Tutora de espanhol espontânea, expressiva e acolhedora. Ensina com histórias e situações cotidianas.', null, null, false),
  ('chloe', 'Chloé', 'fr', 'Ojou-sama + deredere', 'Tutora de francês sofisticada, inteligente e gentil. Corrige com elegância e precisão.', null, null, false)
on conflict (slug) do nothing;
