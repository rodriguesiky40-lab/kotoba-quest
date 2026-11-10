# Kotoba Quest — status real do projeto

## Publicação e infraestrutura
- Site de produção: https://kotoba-quest-app.vercel.app
- Painel administrativo: https://kotoba-quest-app.vercel.app/admin
- Repositório: https://github.com/rodriguesiky40-lab/kotoba-quest
- Stack: Next.js 15, React 19, TypeScript, Supabase e Vercel.
- Último deploy verificado: READY, produção, commit 1da33b71 (10/11/2026).
- O build remoto de produção concluiu com sucesso. Há avisos CSS do Autoprefixer e aviso de dependências SWC ausentes no lockfile; o CSS de alinhamento está sendo normalizado neste commit.

## Funcionalidades existentes no código
- Landing page editorial com cinco tutoras ilustradas: Aiko, Emily, Hana, Sofía e Chloé.
- Interface responsiva e PWA.
- Cadastro, login, recuperação de senha, logout e renovação de sessão.
- Cursos de japonês, inglês, coreano, espanhol e francês.
- Japonês: 5 unidades, 25 lições e 125 exercícios.
- Cursos iniciais nos outros idiomas, com conteúdo introdutório.
- Correção de exercícios no servidor, conclusão de lições e registro de tentativas.
- XP, moedas, corações, recuperação de corações, ofensiva, missões diárias e conquistas.
- Ranking com dados públicos limitados.
- Histórias interativas e pronúncia por síntese de voz do navegador.
- Endpoint de tutora generativa com validação de sessão e contexto de progresso.
- Studio administrativo para gerenciar conteúdo.
- Migrações SQL versionadas; verificações anteriores registraram 23 políticas RLS em 15 tabelas e proteção das respostas corretas.

## Pendências reais
1. **Chave da tutora IA:** a variável `OPENAI_API_KEY` existe no ambiente Production da Vercel, mas está sem valor. O endpoint está implementado, porém a IA generativa só funcionará depois que o proprietário inserir uma chave válida diretamente na Vercel. Nenhum segredo deve ser compartilhado no chat.
2. **Cenário novo do Runway:** a imagem panorâmica foi gerada, mas ainda não está incorporada aos arquivos permanentes do repositório. O link temporário de origem não será usado no site. Há cenários estáticos já incluídos no projeto como alternativa visual.
3. **Animação em vídeo:** o workspace Runway conectado está no plano gratuito e não oferece modelos de vídeo. Não foi feito upgrade nem compra.
4. **QA ponta a ponta:** ainda é necessário testar com uma conta real os fluxos de cadastro, login, lição, progresso e experiência mobile. O build READY não substitui esses testes.
5. **Pagamentos:** deliberadamente adiados; nenhuma cobrança está ativa.

## Verificações anteriores registradas
- TypeScript/TSX passou por verificação estática local em modo strict.
- Referências de assets verificadas em uma revisão anterior.
- Banco: 25 lições, 125 exercícios e 20 exercícios de digitação.
- Funções de correção e conclusão testadas com respostas certas e erradas.
- Respostas `answer_key` não devem ser acessíveis diretamente por usuários comuns.
- Security Advisor do Supabase sem alertas na revisão anterior.
- O build de produção mais recente foi executado pela Vercel e terminou em READY.

## Próxima sequência recomendada
1. Finalizar a limpeza dos avisos CSS e do lockfile, sem alterar o banco.
2. Executar testes de interface e de rotas públicas/autenticadas.
3. Configurar a chave da IA diretamente na Vercel pelo proprietário.
4. Integrar um arquivo de cenário permanente quando o arquivo binário estiver disponível.
5. Retomar animação somente quando houver acesso a um modelo de vídeo.
