-- Posts de redes sociais (Instagram + TikTok) exibidos no carrossel da home.
-- Preenchida automaticamente pela edge function `sync-social-posts`.
-- Rode este SQL no SQL Editor do Supabase.

create table if not exists public.social_posts (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null check (platform in ('instagram', 'tiktok')),
  post_id       text not null,
  permalink     text not null,
  media_url     text,
  caption       text,
  posted_at     timestamptz,
  display_order integer not null default 0,
  hidden        boolean not null default false,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (platform, post_id)
);

create index if not exists social_posts_feed_idx
  on public.social_posts (hidden, deleted_at, posted_at desc);

-- Data API: leitura pública (portal), escrita pelo Admin/backend.
grant select on public.social_posts to anon;
grant select, update on public.social_posts to authenticated;
grant all on public.social_posts to service_role;

alter table public.social_posts enable row level security;

drop policy if exists "Public read access" on public.social_posts;
create policy "Public read access"
  on public.social_posts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated can manage" on public.social_posts;
create policy "Authenticated can manage"
  on public.social_posts
  for update
  to authenticated
  using (true)
  with check (true);

-- Agendamento a cada 6 horas (opcional — requer pg_cron + pg_net habilitados).
-- Troque <PROJECT_REF> e <SERVICE_ROLE_KEY> antes de rodar.
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule(
--   'sync-social-posts',
--   '0 */6 * * *',
--   $$
--   select net.http_post(
--     url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-social-posts',
--     headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
--     body    := '{}'::jsonb
--   );
--   $$
-- );
