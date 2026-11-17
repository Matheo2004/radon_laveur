-- Renomme les zones déjà présentes en base (à exécuter une fois dans Supabase > SQL Editor).
-- Remplace les noms provisoires « commune – secteur N » par le lieu nommé le plus proche.

update public.zone set nom = 'Kerrousseau – Coatibous', remarque = 'Côte vers la pointe du Minou : nom à confirmer' where code = 'Z01';
update public.zone set nom = 'Plage et anse du Dellec', remarque = null where code = 'Z02';
update public.zone set nom = 'Pointe et fort du Portzic', remarque = 'Bunkers et fort : accès à vérifier' where code = 'Z03';
update public.zone set nom = 'Laninon – base navale', remarque = 'Base navale militaire : accès interdit au public' where code = 'Z04';
update public.zone set nom = 'Penfeld – port du Château', remarque = 'Zone portuaire et Marine : accès limité' where code = 'Z05';
update public.zone set nom = 'Port de commerce – Le Guelmeur', remarque = 'Zone industrielle portuaire : accès restreint' where code = 'Z06';
update public.zone set nom = 'Port du Moulin Blanc – plage aux Rats', remarque = null where code = 'Z07';
update public.zone set nom = 'Rubian – plage des Sables Rouges', remarque = null where code = 'Z08';
update public.zone set nom = 'Plage du Moulin Blanc', remarque = 'Commune à vérifier (Brest ou Le Relecq-Kerhuon)' where code = 'Z09';
update public.zone set nom = 'Maison Blanche – Kerdidrun (rive de l''Élorn)', remarque = null where code = 'Z10';
update public.zone set nom = 'Vervian – Kerbasquiou (rive de l''Élorn)', remarque = null where code = 'Z11';
update public.zone set nom = 'Porz Meur – pointe du Caro', remarque = null where code = 'Z12';
update public.zone set nom = 'Fort du Corbeau', remarque = null where code = 'Z13';
update public.zone set nom = 'Kergalleg – Menez Braz', remarque = 'Vers l''anse de Lauberlac''h' where code = 'Z14';
update public.zone set nom = 'Kernizi', remarque = null where code = 'Z15';
update public.zone set nom = 'Le Squifiec – Four à Chaux', remarque = null where code = 'Z16';
update public.zone set nom = 'Saint-Adrien – Saint-Guénolé', remarque = null where code = 'Z17';
update public.zone set nom = 'Kap – Porz ar Vil', remarque = null where code = 'Z18';
update public.zone set nom = 'Grève de Penn al Lann', remarque = null where code = 'Z19';
update public.zone set nom = 'Port du Tinduff – Porz al Loc''h', remarque = null where code = 'Z20';
update public.zone set nom = 'Pointe du Dreff – Le Froud', remarque = null where code = 'Z21';
update public.zone set nom = 'Grève de Porsguen – anse du Moulin Neuf', remarque = null where code = 'Z22';
update public.zone set nom = 'Anse de Penfoul – port de Rostiviec', remarque = null where code = 'Z23';
