-- Sprint 3 – US07 : pesée au point de collecte par scan du QR code.
-- À exécuter une fois dans Supabase > SQL Editor, après 002_us08_points.sql. Relu par Mathéo.
--
-- Déroulé : le référent de l'association vient avec la balance et le QR code du point de collecte.
-- L'étudiant scanne le QR code puis saisit le poids affiché. La fonction ci-dessous vérifie tout
-- côté serveur, puis passe la déclaration en « validee » : le déclencheur de US08 crédite les points.

-- Point de collecte de démonstration (le QR code imprimé contient exactement ce texte).
insert into public.point_collecte (nom, qr_code)
values ('Stand de l''association (balance mobile)', 'RL-PC-ASSO-01')
on conflict (qr_code) do nothing;

-- Poids maximum par déclaration décidé par le PO : 20 kg (limite anti-triche).
alter table public.declaration
  add constraint declaration_poids_max check (poids_kg is null or poids_kg <= 20);

create or replace function public.valider_pesee(p_declaration bigint, p_qr_code text, p_poids numeric)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_point bigint;
  v_decl public.declaration%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Connecte-toi pour faire peser ton ramassage.';
  end if;

  select * into v_decl from public.declaration where id = p_declaration for update;
  if not found or v_decl.profil_id <> auth.uid() then
    raise exception 'Déclaration introuvable.';
  end if;
  if v_decl.statut <> 'en_attente' then
    raise exception 'Cette déclaration a déjà été pesée.';
  end if;

  select id into v_point from public.point_collecte where qr_code = trim(p_qr_code);
  if v_point is null then
    raise exception 'QR code inconnu : scanne celui du point de collecte.';
  end if;

  if p_poids is null or p_poids <= 0 then
    raise exception 'Le poids doit être supérieur à 0 kg.';
  end if;
  if p_poids > 20 then
    raise exception 'Poids trop élevé : 20 kg maximum par déclaration.';
  end if;

  update public.declaration
     set point_collecte_id = v_point,
         poids_kg = round(p_poids, 2),
         statut = 'validee'
   where id = p_declaration;

  -- Points gagnés, pour les afficher (le crédit lui-même est fait par le déclencheur de US08).
  return public.points_pour('validee', round(p_poids, 2));
end;
$$;

revoke execute on function public.valider_pesee(bigint, text, numeric) from public, anon;
grant execute on function public.valider_pesee(bigint, text, numeric) to authenticated;
