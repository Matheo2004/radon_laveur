# Radon Laveur – contexte pour Claude Code

Projet étudiant M2 (gestion de projet Scrum). Application web mobile (PWA) : un « Strava des déchets » pour le littoral de la rade de Brest. L'étudiant déclare un ramassage (photo géolocalisée + pesée par QR code au point de collecte), gagne des points, monte au classement et échange ses points contre des bons d'achat financés par la ville.

## Pile technique

- React 18 + Vite + TypeScript strict (`src/`)
- Supabase : authentification, PostgreSQL, stockage des photos (bucket `photos`). Client dans `src/supabase.ts`, variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local` (jamais commité)
- Schéma : `supabase/schema.sql` (tables zone, profil, point_collecte, declaration, bon_achat, echange, avec RLS). Données : `supabase/seed_zones.sql`
- Hébergement Vercel, CI GitHub Actions (`npm run lint` puis `npm run build`)
- Lecture QR : bibliothèque `html5-qrcode`. Géolocalisation : API du navigateur. Pas de carte dans le MVP (US02 hors MVP)

## Commandes

- `npm run dev` : serveur local (http://localhost:5173)
- `npm run lint` : vérification des types
- `npm run build` : build de production

## Backlog et sprints (MVP = 26 points, vélocité 7 points par sprint de 2 h)

| Sprint | Objectif | Histoires |
| --- | --- | --- |
| 1 | L'application est en ligne et un étudiant crée son compte | T01 socle technique, T02 zones, US01 compte et profil (pseudo, école) |
| 2 | L'étudiant déclare un ramassage avec photo et gagne des points | US06a photo + choix de la zone dans une liste, US08 points selon le poids validé |
| 3 | Le ramassage est prouvé | US07 scan QR + saisie du poids, US06b vérification de la position GPS |
| 4 | Classement et récompense | US09 classement, US12 catalogue des bons, US13 échange points contre bon |

Détail complet : `backlog/backlog.csv`. Ne pas implémenter d'histoire hors du sprint en cours sans qu'on le demande. La réservation de zones a été retirée par le PO : ne pas la réintroduire.

## Règles du projet

- Interface et textes en français. Mobile d'abord (utilisée sur la plage), boutons d'au moins 44 px.
- Couleurs du logo : bleu rade `#0B4F6C`, vert `#2E8B57`, orange déchets `#F28C38`, fond `#F4F9FB`.
- Une branche par histoire (`us01-compte`), pull request relue par un pair ; `main` est protégée. Ne jamais pousser directement sur `main`, ni commiter `.env.local` ou une clé `service_role`.
- Definition of Done : codé, relu, testé, déployé ; `npm run lint` et `npm run build` passent.
- Sécurité : la validation du poids, le calcul et le débit des points se font côté serveur (fonction Postgres ou Edge Function Supabase), jamais en faisant confiance au navigateur. Toute modification des règles RLS est relue par Mathéo.
- Règles d'usage de l'IA : `docs/regles-ia.md` (le code généré doit être compris et expliqué par son auteur).

## Équipe

Nathan (Product Owner), Pauline (Scrum Master), Mathéo (référent technique), Boris et Océane (réalisation).
