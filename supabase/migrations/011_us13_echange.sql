-- Sprint 4 – US13 : échanger ses points contre un bon d'achat.
-- À exécuter une fois dans Supabase > SQL Editor. Relu par Mathéo (débit des points côté serveur).

-- Le navigateur ne crée jamais d'échange lui-même : tout passe par la fonction ci-dessous.
revoke insert, update, delete on public.echange from anon, authenticated;

create or replace function public.echanger_bon(p_bon bigint)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bon public.bon_achat%rowtype;
  v_points integer;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Connecte-toi pour échanger tes points.';
  end if;

  -- « for update » verrouille les lignes : deux échanges simultanés ne peuvent pas dépenser les mêmes points
  -- ni prendre le dernier bon en double.
  select * into v_bon from public.bon_achat where id = p_bon for update;
  if not found then
    raise exception 'Bon introuvable.';
  end if;
  if v_bon.stock <= 0 then
    raise exception 'Ce bon est épuisé.';
  end if;

  select points into v_points from public.profil where id = auth.uid() for update;
  if v_points is null then
    raise exception 'Crée ton profil avant d''échanger des points.';
  end if;
  if v_points < v_bon.cout_points then
    raise exception 'Pas assez de points : il te manque % pts.', v_bon.cout_points - v_points;
  end if;

  -- Code unique à présenter au partenaire, ex. RL-7F3A9C2B.
  loop
    v_code := 'RL-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.echange where code_bon = v_code);
  end loop;

  update public.profil set points = points - v_bon.cout_points where id = auth.uid();
  update public.bon_achat set stock = stock - 1 where id = p_bon;
  insert into public.echange (profil_id, bon_id, code_bon) values (auth.uid(), p_bon, v_code);

  return v_code;
end;
$$;

revoke execute on function public.echanger_bon(bigint) from public, anon;
grant execute on function public.echanger_bon(bigint) to authenticated;
