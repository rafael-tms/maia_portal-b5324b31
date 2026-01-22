-- Fix RLS policies for montages
DROP POLICY IF EXISTS "Allow authenticated update" ON public.montages;
CREATE POLICY "Allow authenticated update" ON public.montages FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Fix RLS policies for gallery
DROP POLICY IF EXISTS "Allow authenticated update" ON public.gallery;
CREATE POLICY "Allow authenticated update" ON public.gallery FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Fix RLS policies for montage_items (just in case)
DROP POLICY IF EXISTS "Allow authenticated update" ON public.montage_items;
CREATE POLICY "Allow authenticated update" ON public.montage_items FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
