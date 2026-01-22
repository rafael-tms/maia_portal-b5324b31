-- Grant necessary permissions to authenticated users
GRANT UPDATE ON public.montages TO authenticated;
GRANT UPDATE ON public.gallery TO authenticated;
GRANT UPDATE ON public.montage_items TO authenticated;

-- Ensure RLS is enabled (should already be, but good to be sure)
ALTER TABLE public.montages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.montage_items ENABLE ROW LEVEL SECURITY;

-- Re-create policies with simplest possible definition to rule out complexity
DROP POLICY IF EXISTS "Allow authenticated update" ON public.montages;
CREATE POLICY "Allow authenticated update" ON public.montages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON public.gallery;
CREATE POLICY "Allow authenticated update" ON public.gallery FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON public.montage_items;
CREATE POLICY "Allow authenticated update" ON public.montage_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
