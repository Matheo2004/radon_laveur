// Ligne de la table `profil` telle que lue par l'application.
export type Profil = {
  id: string
  pseudo: string
  ecole: string | null
  association_id: number | null
  points: number
}

// Colonnes demandées à Supabase quand on lit ou enregistre un profil.
export const COLONNES_PROFIL = 'id, pseudo, ecole, association_id, points'
