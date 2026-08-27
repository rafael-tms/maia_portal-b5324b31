# Carrossel de Redes Sociais (Instagram + TikTok) na Home

Nova seção "Redes Sociais" logo após a seção "Na Mídia" da home, com um carrossel dos posts mais recentes de **@maialeonaa** (Instagram) e **@maiakamperrodrigues** (TikTok), atualizados automaticamente via APIs oficiais.

## Como vai funcionar

1. Uma rotina no servidor busca periodicamente (a cada ~6h) os posts recentes das duas contas nas APIs oficiais.
2. Os posts são gravados em uma tabela no banco (capa, legenda, link, data, rede).
3. A home lê essa tabela — carregamento instantâneo, sem depender das APIs no momento da visita, e sem expor tokens no navegador.
4. Clicar em um card abre o post original no Instagram/TikTok em nova aba.

## Aparência

- Faixa horizontal com cards em formato vertical (9:16), rolagem por arrasto/setas, seguindo o visual do portal (fundo `#0a1611`, verde `#3cc674`, Bricolage Grotesque/Manrope).
- Cada card: capa do post, selo da rede (Instagram/TikTok), data e legenda curta.
- Título traduzido nos 6 idiomas já suportados (PT/EN/ES/DE/FR/IT).
- Lazy loading das capas e altura fixa para não causar salto de layout.

## O que você precisa providenciar

As APIs oficiais exigem credenciais que só o dono das contas pode gerar:

- **Instagram**: conta convertida para Profissional (Criador ou Empresa), vinculada a uma Página do Facebook, e um app no Meta for Developers com o produto Instagram Graph API. Necessário: App ID, App Secret e o token de acesso de longa duração.
- **TikTok**: app no TikTok for Developers com o produto Display API aprovado, e autorização da conta. Necessário: Client Key, Client Secret e o refresh token.

Sem essas credenciais o carrossel fica vazio. Enquanto elas não existirem, ele pode exibir um bloco com link direto para os perfis.

## Detalhes técnicos

- Tabela `social_posts`: `id`, `platform` ('instagram' | 'tiktok'), `post_id` (único por rede), `permalink`, `media_url` (capa reprocessada para WebP), `caption`, `posted_at`, `display_order`, `hidden`, `deleted_at` — com RLS de leitura pública e escrita apenas via service role, mais os GRANTs necessários.
- Edge function `sync-social-posts`: renova o token do TikTok pelo refresh token, chama `graph.instagram.com/me/media` e `open.tiktokapis.com/v2/video/list`, baixa as capas, converte para WebP e salva no storage (as capas do Instagram expiram em ~24h, por isso são rehospedadas), e faz upsert na tabela. Credenciais guardadas como secrets do backend.
- Agendamento a cada 6 horas via pg_cron + pg_net chamando a function; também acionável manualmente pelo Admin.
- Novo `js/update-social.js` seguindo o padrão dos renderizadores atuais (leitura via `supabase-client.js`, filtro `deleted_at is null`, compatível com o modo `?preview=1`).
- Nova seção `#social` em `index.html` após `#midia`, incluída na navegação por dots e no scroll-snap, com as chaves de i18n adicionadas.
- Novo editor no Admin (`SocialEditor.tsx`) para: disparar sincronização manual, ocultar posts individuais, reordenar e pré-visualizar a seção com o `PortalPreview`.
