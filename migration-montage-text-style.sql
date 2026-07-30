-- Estilo de texto nos itens de montagem
ALTER TABLE montage_items ADD COLUMN IF NOT EXISTS bg_color TEXT;
ALTER TABLE montage_items ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 50;
