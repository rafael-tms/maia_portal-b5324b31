-- Força a criação da coluna translations na tabela player_stats
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Verifica se existe, se não, cria
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_stats' AND column_name = 'translations') THEN
    ALTER TABLE player_stats ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
