import { useEffect } from 'react'
import { jouer } from '../fun/sons'

const PLUIE = ['🧴', '🥫', '🛍️', '🧹', '♻️', '🦝', '✨']

// Bandeau de félicitations avec une pluie de déchets ramassés (après une déclaration, par exemple).
export default function PluieFete({ texte, onFin }: { texte: string; onFin: () => void }) {
  useEffect(() => {
    jouer('fanfare')
    const minuteur = window.setTimeout(onFin, 4200)
    return () => window.clearTimeout(minuteur)
  }, [onFin])

  return (
    <div className="pluie-fete" role="status">
      <div className="pluie" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.12}s`, fontSize: `${18 + (i % 4) * 6}px` }}>
            {PLUIE[i % PLUIE.length]}
          </span>
        ))}
      </div>
      <p className="pluie-texte">{texte}</p>
    </div>
  )
}
