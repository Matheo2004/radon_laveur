-- Sprint 2 – US08 : points selon le poids validé, et fermeture de la faille sur les points.
-- À exécuter une fois dans Supabase > SQL Editor, APRÈS schema.sql.
-- Règle du projet : les points ne viennent jamais du navigateur. Ce script est relu par Mathéo.

-- 1. Faille corrigée : le navigateur ne peut plus écrire la colonne `points`.
--    Les règles RLS limitent les lignes ; les droits par colonne limitent les colonnes.
revoke insert, update on public.profil from anon, authenticated;
grant insert (id, pseudo, ecole) on public.profil to authenticated;
grant update (pseudo, ecole) on public.profil to authenticated;

-- 2. Une déclaration créée par l'étudiant est toujours « en attente », sans poids :
--    seules les colonnes ci-dessous sont modifiables depuis le navigateur.
--    (Aucune règle RLS n'autorise la mise à jour : un étudiant ne peut pas se valider lui-même.)
revoke insert, update on public.declaration from anon, authenticated;
grant insert (profil_id, zone_id, photo_url, latitude, longitude) on public.declaration to authenticated;

-- 3. Une déclaration validée a forcément un poids positif.
alter table public.declaration
  add constraint declaration_validee_avec_poids
  check (statut <> 'validee' or (poids_kg is not null and poids_kg > 0));

-- 4. Barème décidé par le PO : 10 points par kg validé, arrondi à l'entier.
create or replace function public.points_pour(statut text, poids numeric)
returns integer
language sql
immutable
as $$
  select case when statut = 'validee' then round(coalesce(poids, 0) * 10)::integer else 0 end;
$$;

-- 5. Crédit automatique : quand une déclaration passe en « validee » (ou que son poids validé change),
--    la base ajoute la différence de points au profil. Si elle repasse en « refusee », les points sont retirés.
--    `security definer` : la fonction s'exécute avec les droits de son propriétaire, pas ceux de l'utilisateur.
create or replace function public.crediter_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ecart integer;
begin
  if tg_op = 'INSERT' then
    ecart := public.points_pour(new.statut, new.poids_kg);
  else
    ecart := public.points_pour(new.statut, new.poids_kg) - public.points_pour(old.statut, old.poids_kg);
  end if;

  if ecart <> 0 then
    update public.profil set points = points + ecart where id = new.profil_id;
  end if;
  return new;
end;
$$;

drop trigger if exists declaration_points on public.declaration;
create trigger declaration_points
  after insert or update of statut, poids_kg on public.declaration
  for each row execute function public.crediter_points();

-- La fonction n'a pas à être appelée directement par les utilisateurs.
revoke execute on function public.crediter_points() from public, anon, authenticated;
