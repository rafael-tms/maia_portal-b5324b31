-- Enable RLS on news table
alter table public.news enable row level security;

-- Policy to allow public read access
create policy "Allow public read access on news"
on public.news
for select
to public
using (true);

-- Policy to allow authenticated users to insert
create policy "Allow authenticated insert on news"
on public.news
for insert
to authenticated
with check (true);

-- Policy to allow authenticated users to update
create policy "Allow authenticated update on news"
on public.news
for update
to authenticated
using (true)
with check (true);

-- Policy to allow authenticated users to delete
create policy "Allow authenticated delete on news"
on public.news
for delete
to authenticated
using (true);
