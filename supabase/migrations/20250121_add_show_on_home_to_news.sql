-- Add show_on_home column to news table
alter table public.news 
add column show_on_home boolean default false;

-- Update existing rows to have a default value
update public.news 
set show_on_home = false;
