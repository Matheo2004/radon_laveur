// Bruitages rigolos, fabriqués à la volée avec Web Audio (aucun fichier son à télécharger).
// Coupés par défaut : on les active avec le bouton 🔈 de l'en-tête (choix gardé dans le navigateur).
export type Son = 'pouet' | 'plop' | 'fanfare' | 'oups' | 'ding'

const CLE = 'radon-son'
let contexte: AudioContext | null = null

export function sonActif(): boolean {
  try {
    return localStorage.getItem(CLE) === 'oui'
  } catch {
    return false
  }
}

export function activerSon(actif: boolean) {
  try {
    localStorage.setItem(CLE, actif ? 'oui' : 'non')
  } catch {
    /* navigation privée : le choix ne sera pas retenu */
  }
  if (actif) jouer('ding')
}

// Une note : fréquence de départ et d'arrivée, durée, forme d'onde.
function note(debut: number, de: number, a: number, duree: number, forme: OscillatorType = 'sine', volume = 0.18) {
  if (!contexte) return
  const t = contexte.currentTime + debut
  const osc = contexte.createOscillator()
  const gain = contexte.createGain()
  osc.type = forme
  osc.frequency.setValueAtTime(de, t)
  osc.frequency.exponentialRampToValueAtTime(a, t + duree)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duree)
  osc.connect(gain).connect(contexte.destination)
  osc.start(t)
  osc.stop(t + duree + 0.02)
}

export function jouer(son: Son) {
  if (!sonActif()) return
  try {
    contexte ??= new AudioContext()
    if (contexte.state === 'suspended') void contexte.resume()
  } catch {
    return
  }
  switch (son) {
    case 'pouet': // klaxon de clown
      note(0, 320, 180, 0.18, 'sawtooth', 0.12)
      note(0.2, 300, 160, 0.25, 'sawtooth', 0.12)
      break
    case 'plop': // goutte d'eau
      note(0, 900, 180, 0.12, 'sine', 0.25)
      break
    case 'ding':
      note(0, 1320, 1320, 0.35, 'triangle', 0.15)
      break
    case 'oups': // glissade vers le grave
      note(0, 500, 90, 0.4, 'square', 0.08)
      break
    case 'fanfare': // petite victoire : do mi sol do
      ;[523, 659, 784, 1047].forEach((f, i) => note(i * 0.12, f, f, i === 3 ? 0.45 : 0.14, 'triangle', 0.16))
      break
  }
}
