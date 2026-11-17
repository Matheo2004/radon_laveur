-- Classement des associations : chaque bénévole peut se rattacher à une association,
-- et les points de ses membres s'additionnent. À exécuter après 009_ecoles_liste.sql. Relu par Mathéo.

create table if not exists public.association (
  id bigint generated always as identity primary key,
  nom text not null unique,
  lien text -- site ou réseau social (US22)
);

alter table public.association enable row level security;
create policy "associations lisibles par tous" on public.association for select using (true);

-- Associations de DÉMONSTRATION : la liste réelle est fournie par l'association cliente (article 7 du contrat).
insert into public.association (nom) values
  ('Zéro déchets en rade de Brest (association cliente)'),
  ('Association partenaire A (exemple)'),
  ('Association partenaire B (exemple)')
on conflict (nom) do nothing;

-- Rattachement facultatif d'un bénévole à une association.
alter table public.profil
  add column if not exists association_id bigint references public.association (id) on delete set null;

-- Droits par colonne (voir 002) : le navigateur peut aussi choisir son association, jamais ses points.
grant insert (association_id) on public.profil to authenticated;
grant update (association_id) on public.profil to authenticated;

-- Total des points par association (somme des points de ses membres).
create or replace view public.classement_associations
with (security_invoker = on) as
select a.id,
       a.nom,
       count(p.id)::integer as benevoles,
       coalesce(sum(p.points), 0)::integer as points
  from public.association a
  left join public.profil p on p.association_id = a.id
 group by a.id, a.nom;

grant select on public.classement_associations to anon, authenticated;
