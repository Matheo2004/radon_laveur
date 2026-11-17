// Niveaux rigolos selon les points (affichage seulement : les points restent calculés par la base).
export type Niveau = { seuil: number; emoji: string; titre: string; phrase: string }

export const NIVEAUX: Niveau[] = [
  { seuil: 0, emoji: '🦐', titre: 'Crevette curieuse', phrase: 'Tout commence par un premier mégot ramassé.' },
  { seuil: 30, emoji: '🦀', titre: 'Crabe bricoleur', phrase: 'Tu avances de côté, mais tu avances !' },
  { seuil: 80, emoji: '🐚', titre: 'Coquillage chasseur', phrase: 'Les plages commencent à murmurer ton nom.' },
  { seuil: 150, emoji: '🐦', titre: 'Mouette vigilante', phrase: 'Rien ne t’échappe depuis le ciel.' },
  { seuil: 250, emoji: '🦭', titre: 'Phoque balayeur', phrase: 'Tu glisses sur le sable et les déchets disparaissent.' },
  { seuil: 400, emoji: '🐬', titre: 'Dauphin du littoral', phrase: 'Les poissons te font des sourires.' },
  { seuil: 600, emoji: '🦝', titre: 'Capitaine Raton', phrase: 'Le raton laveur en chef te salue.' },
  { seuil: 900, emoji: '🐋', titre: 'Légende de la rade', phrase: 'On racontera ton histoire aux bébés phoques.' },
]

export function niveauPour(points: number) {
  let i = 0
  while (i + 1 < NIVEAUX.length && points >= NIVEAUX[i + 1].seuil) i++
  const actuel = NIVEAUX[i]
  const suivant = NIVEAUX[i + 1] ?? null
  const progression = suivant ? (points - actuel.seuil) / (suivant.seuil - actuel.seuil) : 1
  return { index: i, actuel, suivant, progression: Math.max(0, Math.min(1, progression)) }
}
