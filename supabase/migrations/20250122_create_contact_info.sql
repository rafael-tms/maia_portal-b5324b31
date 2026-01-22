-- Create contact_info table
CREATE TABLE IF NOT EXISTS contact_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT DEFAULT 'Fale com a Maia',
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access on contact_info"
    ON contact_info
    FOR SELECT
    TO public
    USING (true);

-- Create policy to allow authenticated update access
CREATE POLICY "Allow authenticated update access on contact_info"
    ON contact_info
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy to allow authenticated insert access (only if table is empty ideally, but simplified here)
CREATE POLICY "Allow authenticated insert access on contact_info"
    ON contact_info
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Insert default row if not exists
INSERT INTO contact_info (title, phone, email)
SELECT 'Fale com a Maia', '+ 49 162 941 6152', 'edu10@web.de'
WHERE NOT EXISTS (SELECT 1 FROM contact_info);
