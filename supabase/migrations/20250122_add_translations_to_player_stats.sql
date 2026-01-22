-- Adiciona coluna de traduções para tabela player_stats
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
