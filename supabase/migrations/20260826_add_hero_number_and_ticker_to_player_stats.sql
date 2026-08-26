-- Mais dois elementos da home saindo do código para o Admin > Estatísticas:
--
--  hero_number — o número da camisa em contorno, ao fundo da hero. É um número,
--                então é comum a todos os idiomas (sem entrada em translations).
--
--  hero_ticker — a faixa que corre logo acima de GOLS / ASSISTÊNCIAS. É prosa,
--                então tem tradução em translations, junto de hero_text e
--                characteristics: { "en": { "hero_ticker": "STRIKER · ..." } }
--                Os itens são separados por "·"; o espaçamento é do layout.

ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS hero_number TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS hero_ticker TEXT;
