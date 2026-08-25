-- Traduções dos cards de trajetória (mesma abordagem de news/today_cards/about_info).
--
-- Formato do JSONB, por idioma. O texto traduzível do carrossel é o nome do
-- clube, o nome de cada categoria e o texto de cada item de stats (período e
-- observações). Ícones e números ficam só na raiz, porque não mudam com o idioma.
--
-- {
--   "en": {
--     "title": "Gil Vicente",
--     "cats": {
--       "t5mwef19c": { "name": "First team", "items": ["2025/2026", "26", "25", "8", "Top scorer…"] }
--     }
--   }
-- }
--
-- As categorias são referenciadas pelo id (não pela posição) para sobreviver a
-- reordenações; os itens, pelo índice dentro da própria categoria.

ALTER TABLE trajectory_cards ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
