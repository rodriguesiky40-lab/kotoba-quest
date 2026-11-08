# Kotoba Quest

Plataforma de aprendizagem de idiomas com cinco trilhas iniciais, cinco tutoras visuais, exercícios, histórias interativas, gamificação e PWA instalável.

## Estado desta entrega

### Implementado nesta versão
- Next.js App Router + TypeScript, interface responsiva para desktop e celular.
- Login, cadastro, recuperação de senha, logout e renovação de sessão via Supabase Auth.
- Curso de japonês carregado do Supabase: 5 unidades, 25 lições e 125 exercícios.
- Exercícios de múltipla escolha e digitação, feedback e pronúncia por síntese de voz do navegador.
- Correção e conclusão de lições no banco; XP, moedas, corações (recuperação de um a cada quatro horas), progresso, ofensiva e missões diárias calculados no backend.
- Proteção das respostas: `answer_key` não pode ser lido pelas roles `anon` e `authenticated`; correção ocorre por RPC autenticada.
- Conquistas e ranking com dados do banco.
- Duas histórias interativas originais com cenários ilustrados.
- Área de conversação com seleção entre as cinco tutoras; endpoint server-side com personalidades e idiomas separados, autenticado por sessão Supabase (requer OPENAI_API_KEY).
- Página de perfil do aluno com XP, moedas, ofensiva, progresso do curso e conquistas.
- Área de exploração com fotografias ilustrativas de destinos japoneses (Kyoto, Tóquio, Monte Fuji e Osaka), usando imagens Unsplash e links de referência/licença.
- Painel administrativo ampliado com indicadores reais, inventário de unidades e formulário para criar e publicar uma aula inicial com questão de múltipla escolha.
- Políticas RLS e grants de gerenciamento de conteúdo limitados a usuários autenticados cujo app_metadata.role seja admin; a coluna answer_key continua sem SELECT para alunos.
- PWA, manifesto, service worker e assets originais otimizados da Aiko, mapa, cenários e recompensas.
- Página de planos informativa; benefícios extras em preparação, sem checkout, assinaturas ou cobranças.
- Painel administrativo visível apenas quando `app_metadata.role` for `admin`.

### Integrações que ainda exigem credenciais/configuração
- Conversação generativa: configurar `OPENAI_API_KEY` no ambiente do Vercel. Sem a chave, a área informa que a integração está pendente.
- Pagamentos: fora do escopo desta etapa, conforme decisão do projeto. Nenhum checkout, assinatura ou cobrança está ativo.
- Administração: atribuir o papel `admin` em `app_metadata` ao usuário autorizado pelo painel do Supabase Auth. Nunca use `user_metadata` para autorização. O editor atual cria aulas com uma primeira questão; gerenciamento completo de todos os tipos de conteúdo ainda precisa ser ampliado.
- Áudio: pronúncia usa Web Speech API do navegador; não substitui reconhecimento fonético profissional nem TTS de estúdio.
- Artes oficiais das cinco tutoras integradas a partir dos arquivos já presentes no repositório: Aiko, Emily, Hana, Sofía e Chloé. Chloé permanece reservada e não publicada como tutora ativa.


### Trilhas multilíngues adicionadas
- Inglês: 2 unidades, 6 lições e 24 questões iniciais.
- Espanhol: 2 unidades, 6 lições e 24 questões iniciais.
- Francês: 2 unidades, 6 lições e 24 questões iniciais.
- Coreano: 2 unidades, 6 lições e 24 questões iniciais.
- O seletor da área de aprendizagem alterna entre japonês, inglês, coreano, espanhol e francês; a seleção fica salva no dispositivo.
- A pronúncia usa a voz do navegador conforme o idioma selecionado.
- Aiko, Emily, Hana e Sofía têm artes e perfis visuais integrados. Chloé também tem arte e perfil visual prontos, mas continua não publicada como tutora ativa.
- As novas trilhas são um primeiro módulo de nível iniciante, não um currículo completo de fluência. É necessário ampliar a sequência de níveis, exercícios variados, escuta e histórias próprias para cada idioma.

## Supabase
- Projeto: `kotoba-quest`
- Região: São Paulo (`sa-east-1`)
- URL: `https://fmxhiatdspywypkrcycd.supabase.co`
- Projeto separado de Ventos da Mandinga.

## Variáveis de ambiente

A chave configurada em `NEXT_PUBLIC_SUPABASE_ANON_KEY` é a chave pública `anon` legada em formato JWT, compatível com o cabeçalho `Authorization: Bearer` usado pelo cliente REST. As tabelas expostas usam RLS; nunca coloque uma chave `service_role` no frontend.

Crie `.env.local` a partir de `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key; nunca service_role)
- `OPENAI_API_KEY` (opcional; somente no servidor, nunca `NEXT_PUBLIC_`)

## Desenvolvimento

```bash
npm install
npm run dev
```

## Produção

```bash
npm run build
npm run start
```

O deploy usa as variáveis já configuradas no projeto Vercel `kotoba-quest`. Não adicione chaves secretas ao repositório.
