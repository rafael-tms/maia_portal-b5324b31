-- Create montages table
CREATE TABLE IF NOT EXISTS public.montages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create montage_items table
CREATE TABLE IF NOT EXISTS public.montage_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    montage_id UUID REFERENCES public.montages(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'text')),
    content TEXT, -- Image URL or Text content
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    w INTEGER NOT NULL DEFAULT 1,
    h INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.montages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.montage_items ENABLE ROW LEVEL SECURITY;

-- Create policies for montages
CREATE POLICY "Allow public read access" ON public.montages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.montages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.montages FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.montages FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for montage_items
CREATE POLICY "Allow public read access" ON public.montage_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.montage_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.montage_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.montage_items FOR DELETE USING (auth.role() = 'authenticated');
