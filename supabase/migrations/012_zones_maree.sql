-- Marées : certaines zones se ramassent surtout à marée basse (plages, grèves, anses, pointes rocheuses),
-- d'autres sont praticables à toute heure (quais et zones portuaires).
-- Proposition à valider par Océane et Nathan sur le terrain. À exécuter dans Supabase > SQL Editor.

alter table public.zone add column if not exists maree_basse boolean not null default true;

-- Zones portuaires de Brest : accessibles quelle que soit la marée.
update public.zone set maree_basse = false where code in ('Z04', 'Z05', 'Z06', 'Z07');
