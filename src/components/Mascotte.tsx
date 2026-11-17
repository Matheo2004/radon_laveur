import { useEffect, useRef, useState } from 'react'
import { jouer } from '../fun/sons'
import { BLAGUES, SALUTATIONS_NUIT } from '../fun/blagues'

const FIGURES = ['saute', 'tourne', 'danse', 'secoue']

// Le raton laveur de l'accueil : il raconte une blague et fait une figure à chaque fois qu'on le touche.
export default function Mascotte({ pseudo }: { pseudo: string }) {
  const heure = new Date().getHours()
  const nuit = heure >= 22 || heure < 6
  const [phrase, setPhrase] = useState(nuit ? SALUTATIONS_NUIT[0] : `Salut ${pseudo} ! Touche-moi pour une blague.`)
  const [figure, setFigure] = useState('')
  const [compteur, setCompteur] = useState(0)
  const [regard, setRegard] = useState({ x: 0, y: 0 })
  const bouton = useRef<HTMLButtonElement>(null)

  // Ses yeux suivent ton doigt ou ta souris, où que tu sois sur la page.
  useEffect(() => {
    function suivre(e: PointerEvent) {
      const zone = bouton.current?.getBoundingClientRect()
      if (!zone) return
      const dx = e.clientX - (zone.left + zone.width / 2)
      const dy = e.clientY - (zone.top + zone.height / 2)
      const distance = Math.hypot(dx, dy) || 1
      setRegard({ x: (dx / distance) * 2.2, y: (dy / distance) * 2.2 })
    }
    window.addEventListener('pointermove', suivre)
    window.addEventListener('pointerdown', suivre)
    return () => {
      window.removeEventListener('pointermove', suivre)
      window.removeEventListener('pointerdown', suivre)
    }
  }, [])

  function chatouiller() {
    const n = compteur + 1
    setCompteur(n)
    jouer(n === 10 ? 'fanfare' : 'pouet')
    setFigure('')
    // On attend une image pour relancer l'animation, même si c'est la même figure.
    window.requestAnimationFrame(() => setFigure(FIGURES[n % FIGURES.length]))
    setPhrase(n === 10 ? '10 chatouilles ! Tu as débloqué… mon respect éternel. 🏅' : BLAGUES[(n * 7) % BLAGUES.length])
  }

  return (
    <div className="mascotte">
      <button
        type="button"
        ref={bouton}
        className={`mascotte-raton ${figure} ${nuit ? 'dort' : ''}`}
        onClick={chatouiller}
        aria-label="Chatouiller le raton laveur"
      >
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <path d="M18,24 L24,8 L32,22 Z" fill="#6f757d" />
          <path d="M48,22 L56,8 L62,24 Z" fill="#6f757d" />
          <ellipse cx="40" cy="44" rx="28" ry="24" fill="#9aa0a8" />
          <path d="M14,42 C22,30 58,30 66,42 C60,52 48,50 40,47 C32,50 20,52 14,42 Z" fill="#2c3036" />
          <ellipse cx="28" cy="34" rx="7" ry="3" fill="#f2f4f6" />
          <ellipse cx="52" cy="34" rx="7" ry="3" fill="#f2f4f6" />
          <g className="yeux">
            <circle cx="29" cy="42" r="4" fill="#fff" />
            <circle cx="51" cy="42" r="4" fill="#fff" />
            <g style={{ transform: `translate(${regard.x}px, ${regard.y}px)`, transition: 'transform 0.08s' }}>
              <circle cx="30" cy="42" r="2" fill="#1d2025" />
              <circle cx="52" cy="42" r="2" fill="#1d2025" />
            </g>
          </g>
          <ellipse cx="40" cy="56" rx="12" ry="8" fill="#e3e6ea" />
          <ellipse cx="40" cy="53" rx="4" ry="3" fill="#1d2025" />
          <path d="M34,59 Q40,64 46,59" stroke="#1d2025" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="54" rx="4" ry="2.5" fill="#f2a0a0" opacity="0.7" />
          <ellipse cx="60" cy="54" rx="4" ry="2.5" fill="#f2a0a0" opacity="0.7" />
        </svg>
        {nuit && (
          <span className="zzz" aria-hidden="true">
            z z z
          </span>
        )}
      </button>
      <p className="bulle" key={phrase} aria-live="polite">
        {phrase}
      </p>
    </div>
  )
}
