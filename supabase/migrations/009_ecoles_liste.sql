-- Liste fixe des écoles (décision du PO) : un seul nom par école, pour un classement par école juste.
-- À exécuter dans Supabase > SQL Editor. La liste doit rester identique à ECOLES dans src/pages/ProfilForm.tsx.

-- 1. Regroupe les anciennes saisies libres sous le nom officiel (« isen », « Isen » → « ISEN Brest »...).
update public.profil
   set ecole = case
     when ecole ilike '%isen%' then 'ISEN Brest'
     when ecole ilike '%ubo%' or ecole ilike '%occidentale%' or ecole ilike 'fac%' then 'UBO – Université de Bretagne Occidentale'
     when ecole ilike '%imt%' then 'IMT Atlantique'
     when ecole ilike '%ensta%' then 'ENSTA'
     when ecole ilike '%enib%' then 'ENIB'
     when ecole ilike '%bbs%' or ecole ilike '%business%' then 'Brest Business School'
     when ecole ilike '%naval%' then 'École navale'
     else 'Autre'
   end
 where ecole is not null and ecole <> '';

-- 2. La base refuse désormais tout nom hors de la liste, même si quelqu'un contourne l'application.
alter table public.profil
  add constraint profil_ecole_liste check (
    ecole is null or ecole in (
      'UBO – Université de Bretagne Occidentale', 'IMT Atlantique', 'ENSTA', 'ENIB',
      'ISEN Brest', 'Brest Business School', 'École navale', 'Autre'
    )
  );
