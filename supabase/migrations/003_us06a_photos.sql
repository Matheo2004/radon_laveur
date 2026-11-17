-- Sprint 2 – US06a : stockage des photos de ramassage.
-- À exécuter une fois dans Supabase > SQL Editor.

-- Bucket public en lecture : la photo sert de preuve et s'affiche dans l'app.
-- Taille limitée à 10 Mo, images uniquement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

-- Chaque étudiant ne dépose des photos que dans son propre dossier : photos/<son id>/...
create policy "chacun dépose ses photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
