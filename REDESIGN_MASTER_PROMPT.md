# Kotoba Quest — Prompt mestre de evolução

Use este briefing em um agente de desenvolvimento com acesso ao repositório. Aplique as mudanças diretamente no projeto existente; não recrie um protótipo separado.

## Objetivo
Transformar o Kotoba Quest em uma plataforma de idiomas premium, autoral, mobile-first e pronta para crescer. Preserve Next.js 15, React 19, TypeScript, Supabase e as integrações já existentes. Não remova autenticação, progresso, XP, moedas, corações, missões, conquistas, ranking, histórias, tutores, painel admin ou PWA.

## Direção visual
- Identidade própria: RPG de aprendizagem com acabamento editorial premium.
- Paleta: ameixa profunda, violeta, lavanda, branco quente e pequenos acentos coral/dourado.
- Tipografia com hierarquia clara; títulos expressivos, texto de leitura confortável.
- Cards com profundidade discreta, bordas suaves, estados de foco visíveis e microinterações rápidas.
- Evitar aparência de template genérico ou cópia de Duolingo.
- Layout desktop em três áreas quando fizer sentido; no celular, navegação simples, áreas tocáveis grandes e sem overflow horizontal.

## Experiência e produto
1. Início: mostrar próxima lição, progresso da unidade, meta diária, sequência, XP e chamada clara para continuar.
2. Trilha: unidades e lições com estados bloqueado, disponível, em andamento e concluído; indicar XP e duração.
3. Aula: foco total no exercício, progresso, feedback explicativo, acessibilidade e navegação por teclado.
4. Tutores: páginas próprias para Aiko, Emily, Hana, Sofía e Chloé; personalidade consistente, arte oficial, exemplos de fala e indicação honesta de recursos ativos.
5. Conversação: distinguir chat real com IA de demonstração; tratar indisponibilidade de API sem simular respostas reais.
6. Histórias: cenas ilustradas, diálogos, áudio quando disponível e decisões com feedback.
7. Recompensas: inventário visual, conquistas, missões e ranking sem valores fictícios.
8. Perfil: nível, estatísticas, preferências e progresso sincronizado.
9. Premium: explicar benefícios, mas não afirmar que cobrança está ativa sem gateway, webhooks e testes.
10. Admin: acesso baseado em app_metadata.role; nunca confiar em permissões vindas do cliente.

## Engenharia e qualidade
- Antes de alterar, mapear componentes, rotas, APIs, schema Supabase e variáveis de ambiente.
- Reutilizar dados reais; não criar contagens ou progresso fictícios.
- Validar estados de carregamento, vazio, erro, offline e sessão expirada.
- Garantir acessibilidade: semântica, labels, contraste, foco, reduced motion.
- Otimizar imagens com next/image quando adequado, lazy loading e dimensões explícitas.
- Verificar responsividade em 360px, 390px, 768px, 1024px e desktop.
- Não expor answer_key, service-role keys, segredos ou dados de outros usuários.
- Não enfraquecer RLS nem contornar RPCs protegidas.
- Não remover recursos existentes para facilitar a implementação.
- Rodar lint, typecheck e build; corrigir todos os erros antes de publicar.
- Documentar integrações pendentes: OPENAI_API_KEY, provedor de pagamento e papel admin.
- Fazer commits pequenos e descritivos; conferir o deployment READY e testar a URL de produção.

## Critério de aceite
O resultado deve parecer um produto comercial coeso, rápido e consistente; funcionar em celular e desktop; preservar os dados e fluxos reais; não conter botões falsos, links quebrados, imagens ausentes ou promessas de funcionalidades ainda não integradas.
