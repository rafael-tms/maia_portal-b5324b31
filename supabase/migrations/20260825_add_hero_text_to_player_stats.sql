-- Parágrafo de apresentação do topo da home (logo abaixo do nome da Maia).
-- Antes era texto fixo no código; passa a ser editável em Admin > Estatísticas.
--
-- As traduções vão na coluna translations que já existe, junto de
-- characteristics: { "en": { "characteristics": "...", "hero_text": "..." } }

ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS hero_text TEXT;
