# Règles d'usage de l'IA – équipe Radon Laveur

Responsable : Boris. Ces règles s'appliquent au code, aux tests et aux documents du projet.

## Ce que l'IA peut faire

- Écrire du code répétitif : formulaires, appels Supabase, styles, types TypeScript.
- Proposer des tests et des jeux de données de test.
- Expliquer une erreur ou une bibliothèque (html5-qrcode, Supabase Auth).
- Relire une pull request en complément de la relecture humaine.

## Ce que l'IA ne fait pas

- Décider à la place de l'équipe : priorités, estimations et choix produit restent des décisions humaines (vote ou PO).
- Recevoir des secrets : jamais de clé Supabase `service_role`, de mot de passe ou de données personnelles de bénévoles dans un prompt.
- Produire du code non compris : si l'auteur de la pull request ne sait pas expliquer une ligne, elle ne passe pas.

## Règles de travail

1. Tout code produit avec l'IA passe par une pull request relue par un autre membre, comme le reste (Definition of Done).
2. On le signale dans la description de la PR : « généré avec l'aide de l'IA » et ce qui a été vérifié.
3. Le code de sécurité (règles RLS Supabase, calcul et débit des points) est écrit ou relu ligne à ligne par Mathéo.
4. En séance de TD, on limite l'IA pour laisser la place à la discussion d'équipe, comme le demande l'énoncé.
