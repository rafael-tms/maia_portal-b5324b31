-- Cria tabela para cards da seção "Hoje"
CREATE TABLE IF NOT EXISTS today_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('news', 'stats')),
  title TEXT NOT NULL,
  left_image_url TEXT,
  
  -- Campos para News
  news_image_url TEXT,
  news_text TEXT,
  news_link TEXT,
  
  -- Campos para Stats (JSONB para armazenar lista de estatísticas)
  -- Exemplo de estrutura: [{"text": "2024/2025"}, {"text": "11 Partidas"}, {"text": "02 Gols"}]
  stats_data JSONB,
  
  display_order SERIAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Permissões
ALTER TABLE today_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON today_cards FOR SELECT USING (true);
CREATE POLICY "Authenticated full access" ON today_cards FOR ALL USING (auth.role() = 'authenticated');

-- Inserir dados iniciais (Exemplos baseados no site atual)
INSERT INTO today_cards (type, title, left_image_url, news_image_url, news_text, news_link, display_order)
VALUES (
  'news', 
  'Seleção Brasileira de Futebol', 
  'https://cdn.prod.website-files.com/696fb9404f3174fa45d7794e/697076a0843658514930113f_CBF_logo.svg.png', 
  'https://cdn.prod.website-files.com/696fb9404f3174fa45d7794e/696fcd3713f1e3553af59c43_Captura-de-Tela-2024-04-08-a%CC%80s-07.30-5.png',
  'Seleção Feminina Sub-20 contará com Maia para preparação do Sul-Americanos.',
  '#',
  1
);

INSERT INTO today_cards (type, title, left_image_url, stats_data, display_order)
VALUES (
  'stats',
  'U.C Sampdoria',
  'https://cdn.prod.website-files.com/696fb9404f3174fa45d7794e/697076a0669147575317765c_Sampdoria_badge.png',
  '[{"text": "2024/2025"}, {"text": "11 Partidas"}, {"text": "02 Gols"}]'::jsonb,
  2
);