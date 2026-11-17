import { useEffect, useState } from 'react'
import { niveauPour } from '../fun/niveaux'
import Confettis from './Confettis'
import { jouer } from '../fun/sons'

const CLE = 'radon-dernier-niveau'

// Niveau rigolo, barre vers le suivant, et équivalences absurdes de ce qui a été ramassé.
export default function Niveau({ points }: { points: number }) {
  const { index, actuel, suivant, progression } = niveauPour(points)
  const [fete, setFete] = useState(false)
  const kg = points / 10

  // Passage de niveau : petite fête (le dernier niveau vu est gardé dans le navigateur).
  useEffect(() => {
    try {
      const garde = localStorage.getItem(CLE)
      if (garde !== null && index > Number(garde)) {
        setFete(true)
        jouer('fanfare')
      }
      localStorage.setItem(CLE, String(index))
    } catch {
      /* navigation privée : pas de fête, tant pis */
    }
  }, [index])

  const nombre = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  const equivalences = [
    { emoji: '🍼', texte: `${Math.round(kg * 40)} bouteilles en plastique` },
    { emoji: '🦝', texte: `${nombre(kg / 7)} raton(s) laveur(s) sur la balance` },
    { emoji: '🐦', texte: `${nombre(kg / 1.1)} mouette(s) bien nourrie(s)` },
    { emoji: '🍕', texte: `${Math.round(kg / 0.45)} pizza(s)… mais en déchets` },
  ]

  return (
    <section className="carte niveau">
      {fete && <Confettis nombre={48} />}
      <div className="niveau-tete">
        <span className="niveau-emoji" aria-hidden="true">
          {actuel.emoji}
        </span>
        <div>
          <p className="aide">Niveau {index + 1}</p>
          <p className="niveau-titre">{actuel.titre}</p>
          <p className="aide">{fete ? '🎉 Nouveau niveau débloqué !' : actuel.phrase}</p>
        </div>
      </div>
      {suivant ? (
        <>
          <div className="niveau-barre" role="progressbar" aria-valuenow={Math.round(progression * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${Math.round(progression * 100)}%` }} />
          </div>
          <p className="aide">
            Plus que <strong>{suivant.seuil - points} pts</strong> pour devenir {suivant.emoji} {suivant.titre}
          </p>
        </>
      ) : (
        <p className="aide">Niveau maximum atteint. Les baleines t’envoient des bisous. 🐋💙</p>
      )}
      {points > 0 && (
        <details className="equivalences">
          <summary>Ce que tu as ramassé, c’est comme…</summary>
          <ul>
            {equivalences.map((e) => (
              <li key={e.emoji}>
                <span aria-hidden="true">{e.emoji}</span> {e.texte}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
