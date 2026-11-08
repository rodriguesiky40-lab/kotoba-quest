# Kotoba Quest — status da entrega

## Entregue no código e no Supabase
- Interface responsiva com a identidade Kotoba Quest e Aiko.
- Imagens da Aiko com fundo quadriculado removido nas versões transparentes usadas pela interface.
- PWA com manifesto e service worker.
- Fluxos de cadastro, login, recuperação de senha, logout e renovação de sessão.
- Trilha de japonês com 5 unidades, 25 lições e 125 exercícios.
- Correção segura no servidor, conclusão de lições e registro de tentativas.
- XP, moedas, corações, recuperação de coração a cada quatro horas, ofensiva, missões diárias e conquistas.
- Ranking com dados públicos limitados ao nome de exibição e pontuação.
- Histórias interativas e pronúncia por síntese de voz do navegador.
- Endpoint server-side para tutora generativa, com validação de sessão.
- Migração SQL versionada para o motor de lições e conteúdo adicional.

## Bloqueios externos para uma operação comercial completa
1. **Publicação do novo código no Vercel:** o projeto foi preparado como Next.js em Node 22, e a proteção SSO foi desativada para permitir acesso público. Porém, o deploy atual ainda é a versão estática antiga. O projeto não está conectado a um repositório Kotoba Quest acessível pelo GitHub conectado, e a ferramenta disponível nesta sessão não permite criar um repositório novo; por isso o novo código foi preparado, mas ainda não foi publicado.
2. **Tutora IA generativa:** falta configurar `OPENAI_API_KEY` como variável secreta no Vercel. O endpoint já está implementado e não expõe a chave ao navegador.
3. **Assinaturas:** falta escolher e conectar um provedor de pagamento, configurar webhooks e validar regras de assinatura. A tela de planos não cobra ninguém.
4. **Administrador:** atribuir `app_metadata.role = "admin"` ao usuário autorizado no Supabase Auth. A interface não permite que um usuário se promova.
5. **QA de autenticação:** ainda não há usuários cadastrados no projeto para executar um teste ponta a ponta de cadastro, sessão e progresso real.

## Verificações realizadas
- TypeScript/TSX passou pela verificação estática local com stubs de tipos, em modo strict e sem variáveis/parâmetros não usados.
- Referências de assets verificadas; nenhuma referência encontrada sem arquivo correspondente.
- Banco: 25 lições, 125 exercícios, 20 exercícios de digitação.
- Banco: 23 políticas RLS em 15 tabelas preservadas.
- Banco: funções de correção e conclusão testadas quanto à resposta correta/incorreta.
- Banco: respostas (`answer_key`) não podem ser lidas por `anon` ou `authenticated` diretamente.
- Supabase Security Advisor: sem alertas após mover as funções SECURITY DEFINER para o schema privado e expor wrappers SECURITY INVOKER.
- **Build de produção Next.js não executado:** o ambiente local não conseguiu acessar `registry.npmjs.org` para instalar dependências. A compilação final precisa ser confirmada pelo build remoto do Vercel.
