-- Add is_active column to montages table
ALTER TABLE public.montages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default (just in case default didn't apply to existing rows which it usually does for NOT NULL, but here it is nullable with default)
UPDATE public.montages SET is_active = true WHERE is_active IS NULL;
