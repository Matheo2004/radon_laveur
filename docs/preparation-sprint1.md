# Préparation du sprint 1

Objectif du sprint 1 : « l'application est en ligne et un étudiant crée son compte ». Avant de commencer, l'environnement doit être prêt pour que les 2 h du sprint servent à coder.

**Prêt quand** : le dépôt existe avec la CI verte, l'URL Vercel affiche les 23 zones, chacun lance l'app en local, et le backlog est dans GitHub Projects.

Ordre conseillé : Mathéo d'abord (étapes 1 à 4), puis tout le monde en parallèle.

## Mathéo (référent technique)

1. **Dépôt GitHub** : créer le dépôt `radon-laveur`, puis depuis ce dossier :
   ```bash
   git init && git add . && git commit -m "Projet de départ"
   git branch -M main
   git remote add origin https://github.com/<proprietaire>/radon-laveur.git
   git push -u origin main
   ```
   Inviter Boris, Océane, Pauline et Nathan (Settings › Collaborators).
2. **Protéger `main`** : Settings › Branches › Add rule : pull request obligatoire, 1 relecture, statut « CI / build » obligatoire.
3. **Supabase** : créer un projet (région Europe), puis dans SQL Editor exécuter `supabase/schema.sql`, puis `supabase/seed_zones.sql`. Dans Storage, créer un bucket `photos` (servira au sprint 2). Récupérer l'URL et la clé `anon` dans Project Settings › API.
4. **Vercel** : Add New › Project › importer le dépôt (framework détecté : Vite). Ajouter les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, déployer, vérifier que la page liste les 23 zones.
5. Transmettre l'URL et la clé `anon` à l'équipe en séance (pas dans Git, pas dans le chat de groupe public).

## Pauline (Scrum Master)

1. Créer le tableau : sur GitHub, Projects › New project › Board, colonnes À faire / En cours / En revue / Terminé, et le relier au dépôt.
2. Importer le backlog (17 éléments, avec étiquettes MoSCoW, points et sprint) :
   ```bash
   gh auth login
   python3 backlog/import-issues.py <proprietaire>/radon-laveur <numero-du-projet>
   ```
3. Placer T01, T02 et US01 dans la colonne À faire du sprint 1 et préparer le minuteur de la séance.

## Nathan (Product Owner)

1. Écrire les critères d'acceptation de T01, T02 et US01 directement dans les issues.
2. Avec Océane, valider la liste des zones (ci-dessous).

## Océane

1. Ouvrir `supabase/zones.csv` : renommer chaque « secteur » avec un vrai nom de lieu (plage, anse, lieu-dit) en s'aidant de la carte et des coordonnées.
2. Vérifier l'accès des zones Z04 à Z06 (Brest, zones portuaires ou militaires probables) : les supprimer ou les remplacer si l'accès est interdit.
3. Reporter les changements dans `supabase/seed_zones.sql` via une pull request.

## Boris

1. Partager `docs/regles-ia.md` à l'équipe et la faire valider.
2. Installer et configurer l'assistant de code (Copilot ou Claude) sur son poste.

## Tout le monde

1. Installer Node.js 22 LTS et Git.
2. Cloner le dépôt, `npm install`, créer `.env.local` à partir de `.env.example`, `npm run dev` : la liste des zones doit s'afficher.
3. Accepter l'invitation au dépôt GitHub et au projet Supabase.
