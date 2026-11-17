// Marées en rade de Brest, à partir des prévisions gratuites d'Open-Meteo (modèle marin, sans clé d'API).
// Valeurs INDICATIVES : ne pas utiliser pour la navigation. La rade étant petite, un seul point
// (entrée de la rade) suffit pour toutes les zones : les heures de marée y sont quasi identiques.
const URL_MAREE =
  'https://marine-api.open-meteo.com/v1/marine?latitude=48.36&longitude=-4.55&hourly=sea_level_height_msl&timezone=Europe%2FParis&forecast_days=3'

// On conseille de ramasser autour de la marée basse : l'estran (la partie découverte) est plus grand.
export const MARGE_HEURES = 2

export type Extremum = { type: 'basse' | 'haute'; heure: Date; hauteur: number }
export type Creneau = { debut: Date; fin: Date; basse: Date; deJour: boolean }
export type Etat = {
  hauteur: number
  tendance: 'montante' | 'descendante'
  prochaine: Extremum | null
  creneauActuel: Creneau | null
  creneaux: Creneau[]
}

const HEURE_MS = 3600 * 1000

// Une heure précise d'extremum, entre deux points horaires, en ajustant une parabole sur trois valeurs.
function ajuster(t: number[], y: number[], i: number): { heure: number; hauteur: number } {
  const a = y[i - 1], b = y[i], c = y[i + 1]
  const denominateur = a - 2 * b + c
  const decalage = denominateur === 0 ? 0 : (a - c) / (2 * denominateur) // en heures, entre -0,5 et 0,5
  return { heure: t[i] + decalage * HEURE_MS, hauteur: b - ((a - c) * decalage) / 4 }
}

export function analyser(heures: string[], hauteurs: (number | null)[], maintenant = new Date()): Etat | null {
  const t: number[] = []
  const y: number[] = []
  heures.forEach((h, i) => {
    const v = hauteurs[i]
    if (v !== null && v !== undefined) {
      t.push(new Date(h).getTime())
      y.push(v)
    }
  })
  if (t.length < 3) return null

  const extrema: Extremum[] = []
  for (let i = 1; i < y.length - 1; i++) {
    const estHaute = y[i] >= y[i - 1] && y[i] > y[i + 1]
    const estBasse = y[i] <= y[i - 1] && y[i] < y[i + 1]
    if (estHaute || estBasse) {
      const { heure, hauteur } = ajuster(t, y, i)
      extrema.push({ type: estHaute ? 'haute' : 'basse', heure: new Date(heure), hauteur })
    }
  }

  // Hauteur actuelle par interpolation linéaire entre les deux heures qui encadrent maintenant.
  const n = maintenant.getTime()
  let k = t.findIndex((x) => x > n)
  if (k <= 0) k = Math.min(Math.max(k, 1), t.length - 1)
  const ratio = (n - t[k - 1]) / (t[k] - t[k - 1])
  const hauteur = y[k - 1] + (y[k] - y[k - 1]) * Math.min(Math.max(ratio, 0), 1)
  const tendance = y[k] >= y[k - 1] ? 'montante' : 'descendante'

  const creneaux: Creneau[] = extrema
    .filter((e) => e.type === 'basse')
    .map((e) => {
      const debut = new Date(e.heure.getTime() - MARGE_HEURES * HEURE_MS)
      const fin = new Date(e.heure.getTime() + MARGE_HEURES * HEURE_MS)
      const h = e.heure.getHours()
      return { debut, fin, basse: e.heure, deJour: h >= 8 && h <= 18 }
    })
    .filter((c) => c.fin.getTime() > n)

  return {
    hauteur,
    tendance,
    prochaine: extrema.find((e) => e.heure.getTime() > n) ?? null,
    creneauActuel: creneaux.find((c) => c.debut.getTime() <= n && n <= c.fin.getTime()) ?? null,
    creneaux,
  }
}

export async function chargerMaree(): Promise<Etat | null> {
  const reponse = await fetch(URL_MAREE)
  if (!reponse.ok) throw new Error('Prévisions de marée indisponibles.')
  const donnees = await reponse.json()
  return analyser(donnees.hourly.time, donnees.hourly.sea_level_height_msl)
}

export const heure = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export const jour = (d: Date) => {
  const aujourdhui = new Date()
  const demain = new Date(aujourdhui.getTime() + 24 * HEURE_MS)
  if (d.toDateString() === aujourdhui.toDateString()) return "aujourd'hui"
  if (d.toDateString() === demain.toDateString()) return 'demain'
  return d.toLocaleDateString('fr-FR', { weekday: 'long' })
}
