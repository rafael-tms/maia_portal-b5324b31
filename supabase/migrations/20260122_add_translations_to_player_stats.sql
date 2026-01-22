
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
