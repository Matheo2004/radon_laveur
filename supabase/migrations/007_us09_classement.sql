-- Sprint 3 – US09 : classement des bénévoles et classement par école (défi inter-écoles, opportunité O3 du TD2).
-- À exécuter une fois dans Supabase > SQL Editor.

-- Total des points par école. security_invoker : la vue applique les droits de celui qui la lit
-- (les profils sont déjà lisibles par tous pour le classement : pseudo, école, points).
create or replace view public.classement_ecoles
with (security_invoker = on) as
select ecole,
       count(*)::integer as etudiants,
       sum(points)::integer as points
  from public.profil
 where ecole is not null and ecole <> ''
 group by ecole;

grant select on public.classement_ecoles to anon, authenticated;
