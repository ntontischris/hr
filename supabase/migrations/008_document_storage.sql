-- Create storage bucket for original document files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- Policy: HR managers and admins can upload files
create policy "HR can upload documents" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
  );

-- Policy: Authenticated users can read files (document-level access is checked in the API)
create policy "Authenticated users can read documents" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
  );

-- Policy: HR managers and admins can delete files
create policy "HR can delete documents" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
  );
