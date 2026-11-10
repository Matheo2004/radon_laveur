-- Schéma de base du MVP Radon Laveur (à exécuter dans Supabase > SQL Editor).
-- Le sprint 1 n'utilise que `zone` et `profil` ; les autres tables servent aux sprints 2 à 4.

create table if not exists public.zone (
  id bigint generated always as identity primary key,
  code text not null unique,
  nom text not null,
  commune text not null,
  latitude double precision not null,
  longitude double precision not null,
  longueur_km numeric(5,1),
  remarque text
);

create table if not exists public.profil (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null unique,
  ecole text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.point_collecte (
  id bigint generated always as identity primary key,
  nom text not null,
  qr_code text not null unique,
  latitude double precision,
  longitude double precision
);

create table if not exists public.declaration (
  id bigint generated always as identity primary key,
  profil_id uuid not null references public.profil (id) on delete cascade,
  zone_id bigint not null references public.zone (id),
  photo_url text,
  latitude double precision,
  longitude double precision,
  point_collecte_id bigint references public.point_collecte (id),
  poids_kg numeric(6,2),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'validee', 'refusee')),
  created_at timestamptz not null default now()
);

create table if not exists public.bon_achat (
  id bigint generated always as identity primary key,
  titre text not null,
  partenaire text,
  cout_points integer not null check (cout_points > 0),
  stock integer not null default 0
);

create table if not exists public.echange (
  id bigint generated always as identity primary key,
  profil_id uuid not null references public.profil (id) on delete cascade,
  bon_id bigint not null references public.bon_achat (id),
  code_bon text not null unique,
  created_at timestamptz not null default now()
);

-- Sécurité : tout est fermé par défaut, puis on ouvre le strict nécessaire.
alter table public.zone enable row level security;
alter table public.profil enable row level security;
alter table public.point_collecte enable row level security;
alter table public.declaration enable row level security;
alter table public.bon_achat enable row level security;
alter table public.echange enable row level security;

create policy "zones lisibles par tous" on public.zone for select using (true);
create policy "points de collecte lisibles par tous" on public.point_collecte for select using (true);
create policy "bons lisibles par tous" on public.bon_achat for select using (true);
create policy "profils lisibles par tous (classement)" on public.profil for select using (true);
create policy "chacun crée son profil" on public.profil for insert with check (auth.uid() = id);
create policy "chacun modifie son profil" on public.profil for update using (auth.uid() = id);
create policy "chacun voit ses déclarations" on public.declaration for select using (auth.uid() = profil_id);
create policy "chacun crée ses déclarations" on public.declaration for insert with check (auth.uid() = profil_id);
create policy "chacun voit ses échanges" on public.echange for select using (auth.uid() = profil_id);

-- À traiter dans les sprints suivants (logique côté serveur, pas depuis le navigateur) :
-- la validation du poids (US07), le calcul des points (US08) et le débit des points
-- lors d'un échange (US13), pour qu'un utilisateur ne puisse pas se créditer lui-même.
