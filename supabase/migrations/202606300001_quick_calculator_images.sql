insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-model-images',
  'project-model-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read quick calculator images" on storage.objects;
drop policy if exists "Users can read own quick calculator images" on storage.objects;
drop policy if exists "Users can read own project model images" on storage.objects;
create policy "Users can read own project model images" on storage.objects
for select to authenticated using (
  bucket_id = 'project-model-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can upload own quick calculator images" on storage.objects;
drop policy if exists "Users can upload own project model images" on storage.objects;
create policy "Users can upload own project model images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'project-model-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own quick calculator images" on storage.objects;
drop policy if exists "Users can update own project model images" on storage.objects;
create policy "Users can update own project model images" on storage.objects
for update to authenticated using (
  bucket_id = 'project-model-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id = 'project-model-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own quick calculator images" on storage.objects;
drop policy if exists "Users can delete own project model images" on storage.objects;
create policy "Users can delete own project model images" on storage.objects
for delete to authenticated using (
  bucket_id = 'project-model-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
