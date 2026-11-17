-- Sorties de groupe (option A choisie par l'équipe) : une association ou une école réserve
-- un créneau sur une zone, et TOUT LE MONDE peut le rejoindre. Pas d'exclusivité : deux sorties
-- peuvent viser la même zone, l'application prévient seulement. Rattaché à US05 / US16 / US21.
-- À exécuter dans Supabase > SQL Editor. Relu par Mathéo (règles RLS).

create table if not exists public.sortie (
  id bigint generated always as identity primary key,
  zone_id bigint not null references public.zone (id),
  organisateur_type text not null check (organisateur_type in ('association', 'ecole')),
  association_id bigint references public.association (id) on delete cascade,
  ecole text,
  debut timestamptz not null,
  fin timestamptz not null,
  places integer check (places is null or places between 2 and 200),
  rendez_vous text not null check (char_length(rendez_vous) between 3 and 200),
  description text check (description is null or char_length(description) <= 500),
  cree_par uuid not null default auth.uid() references public.profil (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (fin > debut and fin <= debut + interval '8 hours'),
  check ((organisateur_type = 'association' and association_id is not null and ecole is null)
      or (organisateur_type = 'ecole' and ecole is not null and association_id is null))
);

create table if not exists public.inscription (
  sortie_id bigint not null references public.sortie (id) on delete cascade,
  profil_id uuid not null default auth.uid() references public.profil (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sortie_id, profil_id)
);

alter table public.sortie enable row level security;
alter table public.inscription enable row level security;

-- Tout le monde voit les sorties et qui y participe (pseudos publics, comme le classement).
create policy "sorties lisibles par tous" on public.sortie for select using (true);
create policy "inscriptions lisibles par tous" on public.inscription for select using (true);

-- On organise au nom de SON association ou de SON école (celles du profil), et seulement dans le futur.
create policy "organiser pour son association ou son école" on public.sortie for insert to authenticated
  with check (
    cree_par = auth.uid()
    and debut > now()
    and exists (
      select 1 from public.profil p
       where p.id = auth.uid()
         and ((organisateur_type = 'association' and p.association_id = sortie.association_id)
           or (organisateur_type = 'ecole' and p.ecole = sortie.ecole))
    )
  );
create policy "l'organisateur annule sa sortie" on public.sortie for delete to authenticated
  using (cree_par = auth.uid());

-- Chacun s'inscrit ou se désinscrit lui-même.
create policy "chacun rejoint une sortie" on public.inscription for insert to authenticated
  with check (profil_id = auth.uid());
create policy "chacun quitte une sortie" on public.inscription for delete to authenticated
  using (profil_id = auth.uid());

-- Places limitées et sorties passées : contrôlé par la base au moment de l'inscription.
create or replace function public.verifier_inscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sortie public.sortie%rowtype;
  v_inscrits integer;
begin
  select * into v_sortie from public.sortie where id = new.sortie_id for update;
  if v_sortie.fin < now() then
    raise exception 'Cette sortie est terminée.';
  end if;
  if v_sortie.places is not null then
    select count(*) into v_inscrits from public.inscription where sortie_id = new.sortie_id;
    if v_inscrits >= v_sortie.places then
      raise exception 'Sortie complète : plus de place disponible.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists inscription_places on public.inscription;
create trigger inscription_places before insert on public.inscription
  for each row execute function public.verifier_inscription();

-- L'organisateur est automatiquement inscrit à sa propre sortie.
create or replace function public.inscrire_organisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inscription (sortie_id, profil_id) values (new.id, new.cree_par) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists sortie_organisateur on public.sortie;
create trigger sortie_organisateur after insert on public.sortie
  for each row execute function public.inscrire_organisateur();

revoke execute on function public.verifier_inscription() from public, anon, authenticated;
revoke execute on function public.inscrire_organisateur() from public, anon, authenticated;

-- Vue pratique pour l'affichage : zone, nom de l'organisateur, nombre d'inscrits.
create or replace view public.sortie_details
with (security_invoker = on) as
select s.*,
       z.code as zone_code,
       z.nom as zone_nom,
       coalesce(a.nom, s.ecole) as organisateur_nom,
       (select count(*) from public.inscription i where i.sortie_id = s.id)::integer as inscrits
  from public.sortie s
  join public.zone z on z.id = s.zone_id
  left join public.association a on a.id = s.association_id;

grant select on public.sortie_details to anon, authenticated;
