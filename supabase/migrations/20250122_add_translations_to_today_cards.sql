-- Adiciona coluna de traduções para cards da seção "Hoje"
ALTER TABLE today_cards ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
