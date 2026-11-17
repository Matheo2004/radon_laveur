-- Zones du littoral de la rade de Brest, de Plouzané à Plougastel-Daoulas.
-- Générées à partir du contour réel des communes (tronçons d'environ 3 km).
-- Coordonnées = milieu du tronçon de côte. Noms : lieu nommé le plus proche (OpenStreetMap), à valider sur le terrain.

insert into public.zone (code, nom, commune, latitude, longitude, longueur_km, remarque) values
  ('Z01', 'Kerrousseau – Coatibous', 'Plouzané', 48.34101, -4.60082, 3.3, 'Côte vers la pointe du Minou : nom à confirmer'),
  ('Z02', 'Plage et anse du Dellec', 'Plouzané', 48.35444, -4.5671, 3.3, null),
  ('Z03', 'Pointe et fort du Portzic', 'Brest', 48.35729, -4.53689, 3.2, 'Bunkers et fort : accès à vérifier'),
  ('Z04', 'Laninon – base navale', 'Brest', 48.37463, -4.50791, 3.2, 'Base navale militaire : accès interdit au public'),
  ('Z05', 'Penfeld – port du Château', 'Brest', 48.38262, -4.47707, 3.2, 'Zone portuaire et Marine : accès limité'),
  ('Z06', 'Port de commerce – Le Guelmeur', 'Brest', 48.38624, -4.45352, 3.2, 'Zone industrielle portuaire : accès restreint'),
  ('Z07', 'Port du Moulin Blanc – plage aux Rats', 'Brest', 48.38284, -4.43652, 3.2, null),
  ('Z08', 'Rubian – plage des Sables Rouges', 'Le Relecq-Kerhuon', 48.39132, -4.3998, 4.3, null),
  ('Z09', 'Plage du Moulin Blanc', 'Guipavas', 48.39751, -4.42827, 1.0, 'Commune à vérifier (Brest ou Le Relecq-Kerhuon)'),
  ('Z10', 'Maison Blanche – Kerdidrun (rive de l''Élorn)', 'Guipavas', 48.40692, -4.36759, 2.8, null),
  ('Z11', 'Vervian – Kerbasquiou (rive de l''Élorn)', 'Guipavas', 48.41327, -4.34111, 2.8, null),
  ('Z12', 'Porz Meur – pointe du Caro', 'Plougastel-Daoulas', 48.33127, -4.44828, 3.0, null),
  ('Z13', 'Fort du Corbeau', 'Plougastel-Daoulas', 48.34903, -4.44467, 3.0, null),
  ('Z14', 'Kergalleg – Menez Braz', 'Plougastel-Daoulas', 48.32971, -4.43235, 3.0, 'Vers l''anse de Lauberlac''h'),
  ('Z15', 'Kernizi', 'Plougastel-Daoulas', 48.36709, -4.42366, 3.0, null),
  ('Z16', 'Le Squifiec – Four à Chaux', 'Plougastel-Daoulas', 48.32728, -4.41387, 3.0, null),
  ('Z17', 'Saint-Adrien – Saint-Guénolé', 'Plougastel-Daoulas', 48.34205, -4.39896, 3.0, null),
  ('Z18', 'Kap – Porz ar Vil', 'Plougastel-Daoulas', 48.38522, -4.3976, 3.0, null),
  ('Z19', 'Grève de Penn al Lann', 'Plougastel-Daoulas', 48.32551, -4.38207, 3.0, null),
  ('Z20', 'Port du Tinduff – Porz al Loc''h', 'Plougastel-Daoulas', 48.34404, -4.36711, 3.0, null),
  ('Z21', 'Pointe du Dreff – Le Froud', 'Plougastel-Daoulas', 48.39855, -4.36494, 3.0, null),
  ('Z22', 'Grève de Porsguen – anse du Moulin Neuf', 'Plougastel-Daoulas', 48.34576, -4.35468, 3.0, null),
  ('Z23', 'Anse de Penfoul – port de Rostiviec', 'Plougastel-Daoulas', 48.35265, -4.32999, 3.0, null)
on conflict (code) do nothing;
