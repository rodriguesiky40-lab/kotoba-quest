-- Keep answer keys server-side: clients can read prompts and options, never the correct answer.
revoke select on public.lesson_questions from anon, authenticated;
grant select (id, lesson_id, prompt, prompt_translation, question_type, options, explanation, audio_url, sort_order)
on public.lesson_questions to anon, authenticated;

insert into public.courses (language_code, character_id, title, description, level, sort_order, is_published)
select 'ja', c.id, 'Japonês do zero', 'Sua primeira jornada: cumprimentos, apresentações e situações do cotidiano.', 'beginner', 1, true
from public.characters c where c.slug = 'aiko'
and not exists (select 1 from public.courses where language_code = 'ja' and title = 'Japonês do zero');

insert into public.units (course_id, title, description, sort_order)
select c.id, 'Uma nova amizade', 'Aprenda a cumprimentar, se apresentar e conversar com confiança.', 1
from public.courses c
where c.language_code = 'ja' and c.title = 'Japonês do zero'
and not exists (select 1 from public.units u where u.course_id = c.id and u.sort_order = 1);

insert into public.lessons (unit_id, title, description, lesson_type, xp_reward, sort_order, is_published)
select u.id, v.title, v.description, v.lesson_type, v.xp, v.ord, true
from public.units u
join public.courses c on c.id = u.course_id
cross join (values
  ('Primeiras palavras','Saudações essenciais para começar uma conversa.','vocabulary',20,1),
  ('Conhecendo pessoas','Diga seu nome e pergunte o nome de alguém.','grammar',25,2),
  ('No café','Peça algo e agradeça com educação.','vocabulary',30,3),
  ('Um novo encontro','Faça perguntas curtas e responda naturalmente.','listening',35,4),
  ('Desafio da Aiko','Revise o que aprendeu nesta primeira unidade.','checkpoint',50,5)
) as v(title,description,lesson_type,xp,ord)
where c.language_code = 'ja' and c.title = 'Japonês do zero' and u.sort_order = 1
and not exists (select 1 from public.lessons l where l.unit_id = u.id and l.sort_order = v.ord);

insert into public.lesson_questions (lesson_id,prompt,prompt_translation,question_type,options,answer_key,explanation,sort_order)
select l.id, q.prompt, q.translation, 'multiple_choice', q.options::jsonb, q.answer_key, q.explanation, 1
from public.lessons l
join public.units u on u.id = l.unit_id
join public.courses c on c.id = u.course_id
join (values
  (1,'おはようございます','Qual é o significado desta saudação?','["Bom dia","Boa noite","Até logo"]','Bom dia','Usamos esta expressão para cumprimentar alguém pela manhã.'),
  (2,'わたしは アナ です','O que a frase está dizendo?','["Meu nome é Ana","Até amanhã, Ana","Boa noite"]','Meu nome é Ana','わたしは significa “eu”; です encerra a frase de forma educada.'),
  (3,'ありがとう','O que significa?','["Desculpe","Obrigado(a)","Por favor"]','Obrigado(a)','ありがとう é uma forma comum de agradecer.'),
  (4,'これは なんですか','Qual é a pergunta?','["Onde fica?","Quanto custa?","O que é isto?"]','O que é isto?','これは なんですか significa “O que é isto?”.'),
  (5,'すみません','Em qual situação esta expressão pode ser usada?','["Para chamar alguém com educação","Para dizer parabéns","Para se despedir"]','Para chamar alguém com educação','すみません pode ser usado para chamar a atenção ou pedir desculpas.')
) as q(ord,prompt,translation,options,answer_key,explanation) on q.ord = l.sort_order
where c.language_code = 'ja' and c.title = 'Japonês do zero'
and not exists (select 1 from public.lesson_questions x where x.lesson_id = l.id);
