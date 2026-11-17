-- RGPD : les photos de ramassage ne sont plus publiques.
-- À exécuter dans Supabase > SQL Editor APRÈS la mise en ligne de la version « photos privées »
-- (l'ancienne version de l'app affiche les photos par leur adresse publique). Relu par Mathéo.

-- 1. Bucket privé : une photo n'est plus visible par simple lien.
update storage.buckets set public = false where id = 'photos';

-- 2. Chacun ne peut lire que les photos de son propre dossier (photos/<son id>/...),
--    via des liens temporaires créés par l'application.
create policy "chacun voit ses photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Les anciennes déclarations stockaient l'adresse publique complète : on ne garde que le chemin.
update public.declaration
   set photo_url = substring(photo_url from '/object/public/photos/(.*)$')
 where photo_url like '%/object/public/photos/%';
