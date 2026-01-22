-- Add is_active column to gallery table
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default
UPDATE public.gallery SET is_active = true WHERE is_active IS NULL;
