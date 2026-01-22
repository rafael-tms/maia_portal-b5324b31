-- Adiciona colunas faltantes na tabela player_stats
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS goals TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS goals_per_game TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS assists TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS matches TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS characteristics TEXT;

-- Garante que o ID fixo (UUID) exista
INSERT INTO player_stats (id, goals, goals_per_game, assists, matches, characteristics)
VALUES ('db940e8a-aed5-41cd-a2e8-a7adcf44a457', '236', '1,72', '100', '137', 'Ambidestra, boa finalização, bom posicionamento, boa leitura de jogo, cobradora de faltas e penaltis.')
ON CONFLICT (id) DO NOTHING;