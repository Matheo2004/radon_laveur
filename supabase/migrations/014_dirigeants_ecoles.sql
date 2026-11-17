-- Retours de revue : chacun peut ajouter son école ou son association si elle manque,
-- et seuls les DIRIGEANTS d'une école ou d'une association peuvent créer des sorties.
-- Décisions de l'équipe : une école ou une association créée est utilisable tout de suite et son
-- créateur en devient dirigeant ; pour celles qui existent déjà, on demande à être dirigeant et un
-- administrateur valide la demande. À exécuter après 013_sorties.sql. Relu par Mathéo (RLS).

-- 1. Les écoles deviennent une table (au lieu d'une liste fixe dans le code).
create table if not exists public.ecole (
  id bigint generated always as identity primary key,
  nom text not null unique check (char_length(trim(nom)) between 2 and 80),
  cree_par uuid references public.profil (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
-- Doublons refusés sans tenir compte des majuscules ni des espaces (« isen brest » = « ISEN Brest »).
create unique index if not exists ecole_nom_unique on public.ecole (lower(regexp_replace(trim(nom), '\s+', ' ', 'g')));

insert into public.ecole (nom, cree_par) values
  ('UBO – Université de Bretagne Occidentale', null), ('IMT Atlantique', null), ('ENSTA', null), ('ENIB', null),
  ('ISEN Brest', null), ('Brest Business School', null), ('École navale', null), ('Autre', null)
on conflict do nothing;

alter table public.ecole enable row level security;
create policy "écoles lisibles par tous" on public.ecole for select using (true);
create policy "chacun ajoute une école" on public.ecole for insert to authenticated with check (cree_par = auth.uid());

-- Le profil et les sorties pointent vers la table (la contrainte de liste fixe disparaît).
alter table public.profil drop constraint if exists profil_ecole_liste;
alter table public.profil drop constraint if exists profil_ecole_fk;
alter table public.profil add constraint profil_ecole_fk foreign key (ecole) references public.ecole (nom) on update cascade;
alter table public.sortie drop constraint if exists sortie_ecole_fk;
alter table public.sortie add constraint sortie_ecole_fk foreign key (ecole) references public.ecole (nom) on update cascade;

-- 2. Associations : même principe (création par les utilisateurs, doublons refusés).
alter table public.association add column if not exists cree_par uuid references public.profil (id) on delete set null default auth.uid();
create unique index if not exists association_nom_unique on public.association (lower(regexp_replace(trim(nom), '\s+', ' ', 'g')));
create policy "chacun ajoute une association" on public.association for insert to authenticated with check (cree_par = auth.uid());

-- 3. Dirigeants : qui peut organiser au nom d'une école ou d'une association.
create table if not exists public.dirigeant (
  id bigint generated always as identity primary key,
  profil_id uuid not null default auth.uid() references public.profil (id) on delete cascade,
  association_id bigint references public.association (id) on delete cascade,
  ecole text references public.ecole (nom) on update cascade on delete cascade,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'valide', 'refuse')),
  created_at timestamptz not null default now(),
  check ((association_id is null) <> (ecole is null))
);
create unique index if not exists dirigeant_unique on public.dirigeant (profil_id, coalesce(association_id, 0), coalesce(ecole, ''));

alter table public.dirigeant enable row level security;
-- Chacun voit ses propres demandes ; seul un administrateur (SQL Editor) les valide.
create policy "chacun voit ses demandes de dirigeant" on public.dirigeant for select to authenticated using (profil_id = auth.uid());
create policy "chacun demande à être dirigeant" on public.dirigeant for insert to authenticated
  with check (profil_id = auth.uid() and statut = 'en_attente');

-- Le créateur d'une école ou d'une association en devient dirigeant automatiquement.
create or replace function public.creer_dirigeant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cree_par is not null then
    if tg_table_name = 'ecole' then
      insert into public.dirigeant (profil_id, ecole, statut) values (new.cree_par, new.nom, 'valide') on conflict do nothing;
    else
      insert into public.dirigeant (profil_id, association_id, statut) values (new.cree_par, new.id, 'valide') on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ecole_dirigeant on public.ecole;
create trigger ecole_dirigeant after insert on public.ecole for each row execute function public.creer_dirigeant();
drop trigger if exists association_dirigeant on public.association;
create trigger association_dirigeant after insert on public.association for each row execute function public.creer_dirigeant();
revoke execute on function public.creer_dirigeant() from public, anon, authenticated;

-- 4. Seuls les dirigeants VALIDÉS créent des sorties au nom de leur école ou association.
drop policy if exists "organiser pour son association ou son école" on public.sortie;
create policy "seuls les dirigeants organisent" on public.sortie for insert to authenticated
  with check (
    cree_par = auth.uid()
    and debut > now()
    and exists (
      select 1 from public.dirigeant d
       where d.profil_id = auth.uid()
         and d.statut = 'valide'
         and ((sortie.organisateur_type = 'association' and d.association_id = sortie.association_id)
           or (sortie.organisateur_type = 'ecole' and d.ecole = sortie.ecole))
    )
  );

-- Pour valider une demande (administrateur, SQL Editor) :
--   update public.dirigeant set statut = 'valide' where id = <id de la demande>;
-- Pour voir les demandes en attente :
--   select d.id, p.pseudo, coalesce(a.nom, d.ecole) as organisation, d.created_at
--     from public.dirigeant d join public.profil p on p.id = d.profil_id
--     left join public.association a on a.id = d.association_id
--    where d.statut = 'en_attente' order by d.created_at;
