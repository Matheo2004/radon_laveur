-- Sprint 3 – US12 : catalogue des bons d'achat et des commerces partenaires.
-- À exécuter une fois dans Supabase > SQL Editor.

alter table public.bon_achat
  add column if not exists description text,
  add column if not exists partenaire_adresse text,
  add column if not exists partenaire_lien text;

-- Bons de DÉMONSTRATION : partenaires et montants fictifs, à remplacer par ceux négociés avec la ville
-- et les commerçants (décision du PO). Barème : 10 points par kg, donc 100 pts = 10 kg ramassés.
insert into public.bon_achat (titre, description, partenaire, partenaire_adresse, cout_points, stock)
select * from (values
  ('Boisson chaude offerte', 'Un café, thé ou chocolat chaud', 'Café partenaire (exemple)', 'Port du Moulin Blanc, Brest', 50, 40),
  ('Bon de 5 € en librairie', 'À valoir sur tout le magasin', 'Librairie partenaire (exemple)', 'Centre-ville de Brest', 100, 25),
  ('Place de cinéma', 'Une place pour la séance de ton choix', 'Cinéma partenaire (exemple)', 'Brest', 250, 15),
  ('Bon de 15 € en magasin de sport', 'Équipement de plein air', 'Magasin de sport partenaire (exemple)', 'Guipavas', 300, 10),
  ('Sortie kayak en rade de Brest', 'Initiation de 2 h avec un club nautique', 'Club nautique partenaire (exemple)', 'Plougastel-Daoulas', 500, 5)
) as bons(titre, description, partenaire, partenaire_adresse, cout_points, stock)
where not exists (select 1 from public.bon_achat);
