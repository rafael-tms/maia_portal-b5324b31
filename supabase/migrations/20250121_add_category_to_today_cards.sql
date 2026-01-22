-- Adiciona coluna de categoria para cards de estatística
ALTER TABLE today_cards ADD COLUMN IF NOT EXISTS category TEXT;