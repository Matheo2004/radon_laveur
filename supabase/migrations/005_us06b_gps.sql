-- Sprint 3 – US06b : vérification de la position GPS de la déclaration.
-- À exécuter dans Supabase > SQL Editor SEULEMENT APRÈS la mise en ligne de US06b
-- (sinon l'ancienne version de l'app, qui n'envoie pas la position, ne pourrait plus déclarer).
--
-- Règle (décision équipe) : la position doit être à moins de « demi-longueur de la zone + 500 m »
-- du point central de la zone. Exemple : zone de 3 km → rayon de 2 km.

-- Distance en mètres entre deux points GPS (formule de haversine, rayon terrestre 6 371 km).
create or replace function public.distance_m(lat1 double precision, lon1 double precision,
                                             lat2 double precision, lon2 double precision)
returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

create or replace function public.verifier_position()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zone public.zone%rowtype;
  v_distance double precision;
  v_rayon double precision;
begin
  if new.latitude is null or new.longitude is null then
    raise exception 'Position GPS manquante : active la localisation pour déclarer.';
  end if;

  select * into v_zone from public.zone where id = new.zone_id;
  v_rayon := coalesce(v_zone.longueur_km, 3) * 500 + 500;
  v_distance := public.distance_m(new.latitude, new.longitude, v_zone.latitude, v_zone.longitude);

  if v_distance > v_rayon then
    raise exception 'Tu es à % km de la zone % (% km maximum) : choisis la zone où tu te trouves.',
      round((v_distance / 1000)::numeric, 1), v_zone.code, round((v_rayon / 1000)::numeric, 1);
  end if;
  return new;
end;
$$;

drop trigger if exists declaration_position on public.declaration;
create trigger declaration_position
  before insert on public.declaration
  for each row execute function public.verifier_position();

revoke execute on function public.verifier_position() from public, anon, authenticated;
