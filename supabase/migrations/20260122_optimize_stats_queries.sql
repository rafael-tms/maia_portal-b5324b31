-- Migration to optimize queries for stats editor
-- Created on 2026-01-22

-- 1. Add index on 'type' column for today_cards table
-- Used in StatsEditor.tsx: .from('today_cards').select(...).eq('type', 'stats')
CREATE INDEX IF NOT EXISTS idx_today_cards_type ON today_cards(type);

-- 2. Add comment for future reference
COMMENT ON INDEX idx_today_cards_type IS 'Optimizes filtering by card type (stats vs news)';
