-- Run in Supabase SQL editor
alter table profiles add column if not exists nickname text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists grade_level text;
alter table profiles add column if not exists phone text;

-- Create public avatars bucket
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

-- Storage policies for avatars
create policy "Anyone can view avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users upload own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update own avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
