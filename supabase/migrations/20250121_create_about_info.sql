-- Cria tabela para informações dinâmicas "Sobre a Maia"
CREATE TABLE IF NOT EXISTS about_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order SERIAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Permissões
ALTER TABLE about_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON about_info FOR SELECT USING (true);
CREATE POLICY "Authenticated full access" ON about_info FOR ALL USING (auth.role() = 'authenticated');

-- Inserir dados iniciais
INSERT INTO about_info (label, value, display_order) VALUES
('Nome', 'Maia Leona Kamper Rodrigues', 1),
('Estado civil', 'Solteira', 2),
('Nascimento', '11/12/2006', 3),
('Cidade', 'Krefeld - Alemanha', 4),
('Altura', '1,69', 5),
('Peso', '67kg', 6),
('Passaporte', 'Brasileiro e Alemão', 7);