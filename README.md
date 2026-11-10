# Radon Laveur

Ramassons main dans la main. Application web mobile (PWA) qui transforme chaque ramassage de déchets sur le littoral de la rade de Brest en points et en bons d'achat financés par la ville.

Pile technique : React + Vite + TypeScript, Supabase (authentification, PostgreSQL, stockage des photos), Vercel, GitHub Actions.

## Démarrer en local

Prérequis : Node.js 22 LTS et Git.

```bash
git clone <url-du-depot>
cd radon-laveur
npm install
cp .env.example .env.local   # puis coller l'URL et la clé anon Supabase
npm run dev                  # http://localhost:5173
```

La page d'accueil affiche les 23 zones du littoral lues dans Supabase : si elles s'affichent, l'environnement est prêt.

## Contenu du dépôt

| Chemin | Rôle |
| --- | --- |
| `src/` | Application React |
| `supabase/schema.sql` | Tables et règles de sécurité du MVP |
| `supabase/seed_zones.sql`, `supabase/zones.csv` | 23 zones du littoral, de Plouzané à Plougastel-Daoulas |
| `backlog/backlog.csv`, `backlog/import-issues.py` | Backlog du TD1 et script d'import en issues GitHub |
| `docs/preparation-sprint1.md` | Ce que chacun fait avant le sprint 1 |
| `docs/regles-ia.md` | Règles d'usage de l'IA |
| `.github/workflows/ci.yml` | Vérification des types et build à chaque pull request |

## Règles de travail

- `main` est protégée : une branche par histoire (`us01-compte`), pull request relue par un pair, CI verte.
- Une histoire est terminée si elle est codée, relue, testée et déployée.
- Le fichier `.env.local` ne doit jamais être commité.
