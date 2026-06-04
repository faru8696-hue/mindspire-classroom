create table if not exists board_images (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  image_path text not null,
  order_index integer default 0,
  created_at timestamptz default now() not null
);
alter table board_images enable row level security;
create policy "board_img_student" on board_images for all using (student_id = auth.uid());
create policy "board_img_teacher" on board_images for all using (auth_role() = 'teacher');

-- Storage policy for board images
create policy "board_upload" on storage.objects for insert with check (
  bucket_id = 'submissions' and auth.uid()::text = (storage.foldername(name))[1]
);
