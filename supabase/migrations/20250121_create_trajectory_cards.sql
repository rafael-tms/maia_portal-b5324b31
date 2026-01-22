-- Cria tabela para cards da seção "Trajetória" (apenas estatísticas)
CREATE TABLE IF NOT EXISTS trajectory_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  left_image_url TEXT,
  
  -- Campos para Stats (JSONB)
  -- Ex: [{"text": "2023/2024", "icon": "images/calendar-1.png"}]
  stats_data JSONB,
  category TEXT,
  
  display_order SERIAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Permissões
ALTER TABLE trajectory_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON trajectory_cards FOR SELECT USING (true);
CREATE POLICY "Authenticated full access" ON trajectory_cards FOR ALL USING (auth.role() = 'authenticated');

-- Inserir dados iniciais (Exemplo base)
INSERT INTO trajectory_cards (title, left_image_url, stats_data, category, display_order)
VALUES (
  'Borussia Mönchengladbach',
  'https://cdn.prod.website-files.com/696fb9404f3174fa45d7794e/697076a0d20d77c387e35791_borussia-monchengladbach-logo.svg.png',
  '[
    {"text": "2023/2024", "icon": "images/calendar-1.png"},
    {"text": "14 Partidas", "icon": "images/partidas.png"},
    {"text": "06 Gols", "icon": "images/goal-1.png"},
    {"text": "05 Assistências", "icon": "images/assitencia2.png"}
  ]'::jsonb,
  'Sub 17',
  1
);