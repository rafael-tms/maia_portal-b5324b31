-- Add is_active column to montage_items table
ALTER TABLE public.montage_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default
UPDATE public.montage_items SET is_active = true WHERE is_active IS NULL;
