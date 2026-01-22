
create table public.videos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  thumbnail_url text,
  video_url text not null,
  is_active boolean default true,
  show_on_home boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.videos enable row level security;

create policy "Enable read access for all users"
on public.videos for select
using (true);

create policy "Enable insert for authenticated users only"
on public.videos for insert
with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only"
on public.videos for update
using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only"
on public.videos for delete
using (auth.role() = 'authenticated');
