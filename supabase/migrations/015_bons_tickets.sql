-- Bons d'achat plus variés et mieux présentés : catégorie, emoji et bons de démonstration supplémentaires.
-- Partenaires et montants FICTIFS (« exemple ») : à remplacer par ceux négociés avec la ville et les commerçants.
-- Barème rappel : 10 points par kg ramassé. À exécuter dans Supabase > SQL Editor.

alter table public.bon_achat
  add column if not exists emoji text,
  add column if not exists categorie text check (categorie in ('gourmandise', 'sortie', 'mer', 'eco', 'culture'));

-- Les 5 bons existants gardent leur identifiant (des échanges y font référence) : on les complète.
update public.bon_achat set emoji = '☕', categorie = 'gourmandise', titre = 'Chocolat chaud du marin', description = 'Une boisson chaude pour se réchauffer après la marée' where titre = 'Boisson chaude offerte';
update public.bon_achat set emoji = '📚', categorie = 'culture', description = 'À valoir sur tout le magasin, BD comprises' where titre = 'Bon de 5 € en librairie';
update public.bon_achat set emoji = '🎬', categorie = 'sortie', description = 'Une place pour la séance de ton choix, pop-corn non inclus' where titre = 'Place de cinéma';
update public.bon_achat set emoji = '👟', categorie = 'mer', description = 'Gants, bottes, coupe-vent : de quoi affronter la rade' where titre = 'Bon de 15 € en magasin de sport';
update public.bon_achat set emoji = '🛶', categorie = 'mer', description = 'Initiation de 2 h avec un club nautique : on voit la rade autrement' where titre = 'Sortie kayak en rade de Brest';

insert into public.bon_achat (titre, description, partenaire, partenaire_adresse, cout_points, stock, emoji, categorie)
select * from (values
  ('Crêpe beurre-sucre', 'La récompense bretonne officielle', 'Crêperie partenaire (exemple)', 'Port du Moulin Blanc, Brest', 40, 60, '🥞', 'gourmandise'),
  ('Glace deux boules', 'Parfum caramel au beurre salé conseillé', 'Glacier partenaire (exemple)', 'Plougastel-Daoulas', 60, 40, '🍦', 'gourmandise'),
  ('Kit du parfait ramasseur', 'Pince, gants et sacs réutilisables pour tes prochaines sorties', 'Association cliente', 'Remis au stand de pesée', 80, 30, '🧤', 'eco'),
  ('Gourde inox Radon Laveur', 'Fini les bouteilles en plastique, même pour toi', 'Association cliente', 'Remise au stand de pesée', 120, 25, '💧', 'eco'),
  ('Entrée à l''aquarium', 'Va saluer les poissons que tu protèges', 'Aquarium partenaire (exemple)', 'Brest', 350, 10, '🐠', 'sortie'),
  ('Initiation paddle', '1 h 30 sur l''eau, au lever ou au coucher du soleil', 'Base nautique partenaire (exemple)', 'Le Relecq-Kerhuon', 400, 8, '🏄', 'mer'),
  ('Place de concert', 'Une soirée dans une salle brestoise partenaire', 'Salle de concert partenaire (exemple)', 'Brest', 450, 6, '🎸', 'culture')
) as bons(titre, description, partenaire, partenaire_adresse, cout_points, stock, emoji, categorie)
where not exists (select 1 from public.bon_achat b where b.titre = bons.titre);
