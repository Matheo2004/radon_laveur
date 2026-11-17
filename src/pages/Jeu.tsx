import { useCallback, useEffect, useRef, useState } from 'react'
import { jouer } from '../fun/sons'
import Confettis from '../components/Confettis'

// « Le défi du raton » : un mini-jeu pour patienter entre deux marées.
// On déplace le raton (doigt, souris ou flèches) pour attraper les déchets qui tombent,
// sans attraper les animaux marins. Juste pour rire : aucun point de l'appli en jeu.
const DECHETS = ['🧴', '🥫', '🛍️', '🚬', '📦', '🥤', '🧃']
const ANIMAUX = ['🐟', '🦀', '🐚', '🐙', '🐢']
const LARGEUR_RATON = 16 // en % de la largeur du terrain
const CLE_RECORD = 'radon-record-jeu'

type Objet = { id: number; x: number; y: number; emoji: string; dechet: boolean; vitesse: number }
type Etat = 'accueil' | 'en-cours' | 'fini'

const lireRecord = () => {
  try {
    return Number(localStorage.getItem(CLE_RECORD) ?? 0)
  } catch {
    return 0
  }
}

export default function Jeu({ onRetour }: { onRetour: () => void }) {
  const [etat, setEtat] = useState<Etat>('accueil')
  const [objets, setObjets] = useState<Objet[]>([])
  const [raton, setRaton] = useState(50) // position horizontale du centre, en %
  const [score, setScore] = useState(0)
  const [vies, setVies] = useState(3)
  const [message, setMessage] = useState<string | null>(null)
  const [record, setRecord] = useState(lireRecord())
  const [nouveauRecord, setNouveauRecord] = useState(false)
  const terrain = useRef<HTMLDivElement>(null)
  const ratonRef = useRef(50)
  const identifiant = useRef(0)
  const dernierApparu = useRef(0)
  const debut = useRef(0)
  const objetsRef = useRef<Objet[]>([]) // la boucle lit et écrit ici, puis met l'écran à jour

  const deplacer = useCallback((x: number) => {
    const borne = Math.max(LARGEUR_RATON / 2, Math.min(100 - LARGEUR_RATON / 2, x))
    ratonRef.current = borne
    setRaton(borne)
  }, [])

  function demarrer() {
    objetsRef.current = []
    setObjets([])
    setScore(0)
    setVies(3)
    setMessage(null)
    setNouveauRecord(false)
    deplacer(50)
    debut.current = performance.now()
    dernierApparu.current = 0
    setEtat('en-cours')
    jouer('ding')
  }

  // Boucle du jeu : les objets tombent, de plus en plus vite et de plus en plus souvent.
  useEffect(() => {
    if (etat !== 'en-cours') return
    let image = 0
    let precedent = performance.now()

    const tour = (t: number) => {
      const dt = Math.min(50, t - precedent) / 1000
      precedent = t
      const ecoule = (t - debut.current) / 1000
      const intervalle = Math.max(380, 1000 - ecoule * 18)

      {
        let suite = objetsRef.current.map((o) => ({ ...o, y: o.y + o.vitesse * dt }))
        if (t - dernierApparu.current > intervalle) {
          dernierApparu.current = t
          const dechet = Math.random() > 0.28
          const source = dechet ? DECHETS : ANIMAUX
          suite.push({
            id: identifiant.current++,
            x: 6 + Math.random() * 88,
            y: -8,
            emoji: source[Math.floor(Math.random() * source.length)],
            dechet,
            vitesse: 28 + ecoule * 1.4 + Math.random() * 10,
          })
        }

        const restants: Objet[] = []
        for (const o of suite) {
          const auNiveauDuRaton = o.y >= 82 && o.y <= 94
          const toucheRaton = auNiveauDuRaton && Math.abs(o.x - ratonRef.current) < LARGEUR_RATON / 2 + 3
          if (toucheRaton) {
            if (o.dechet) {
              setScore((s) => s + 1)
              jouer('plop')
            } else {
              setVies((v) => v - 1)
              setMessage(`Oups ! Laisse ${o.emoji} tranquille, il habite ici !`)
              jouer('oups')
            }
          } else if (o.y > 104) {
            if (o.dechet) setMessage('Un déchet t’a échappé… la mouette te juge.')
          } else {
            restants.push(o)
          }
        }
        suite = restants
        objetsRef.current = suite
        setObjets(suite)
      }
      image = requestAnimationFrame(tour)
    }
    image = requestAnimationFrame(tour)
    return () => cancelAnimationFrame(image)
  }, [etat])

  // Fin de partie quand il n'y a plus de vies.
  useEffect(() => {
    if (etat === 'en-cours' && vies <= 0) {
      setEtat('fini')
      if (score > record) {
        setRecord(score)
        setNouveauRecord(true)
        jouer('fanfare')
        try {
          localStorage.setItem(CLE_RECORD, String(score))
        } catch {
          /* pas de record gardé en navigation privée */
        }
      } else {
        jouer('pouet')
      }
    }
  }, [vies, etat, score, record])

  // Clavier : flèches gauche et droite.
  useEffect(() => {
    if (etat !== 'en-cours') return
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') deplacer(ratonRef.current - 7)
      if (e.key === 'ArrowRight') deplacer(ratonRef.current + 7)
    }
    window.addEventListener('keydown', clavier)
    return () => window.removeEventListener('keydown', clavier)
  }, [etat, deplacer])

  function glisser(e: React.PointerEvent<HTMLDivElement>) {
    if (etat !== 'en-cours' || !terrain.current) return
    const zone = terrain.current.getBoundingClientRect()
    deplacer(((e.clientX - zone.left) / zone.width) * 100)
  }

  const titre = score >= 40 ? '🐋 Légende du balai' : score >= 25 ? '🦭 Phoque turbo' : score >= 12 ? '🦀 Crabe agile' : '🦐 Crevette en rodage'

  return (
    <section className="carte jeu">
      <h2>🎮 Le défi du raton</h2>
      <p className="aide">Attrape les déchets 🧴🥫, mais laisse les animaux 🐟🦀 tranquilles !</p>

      <div className="jeu-scores">
        <span>Score : <strong>{score}</strong></span>
        <span aria-label={`${vies} vies`}>{'❤️'.repeat(Math.max(0, vies))}{'🤍'.repeat(Math.max(0, 3 - vies))}</span>
        <span>Record : <strong>{record}</strong></span>
      </div>

      <div
        ref={terrain}
        className={`jeu-terrain ${etat}`}
        onPointerMove={glisser}
        onPointerDown={glisser}
        role="application"
        aria-label="Terrain de jeu : glisse le doigt ou utilise les flèches pour déplacer le raton"
      >
        {objets.map((o) => (
          <span key={o.id} className="jeu-objet" style={{ left: `${o.x}%`, top: `${o.y}%` }} aria-hidden="true">
            {o.emoji}
          </span>
        ))}
        <span className="jeu-raton" style={{ left: `${raton}%` }} aria-hidden="true">
          <span className="jeu-poubelle">🗑️</span>
          🦝
        </span>
        {message && etat === 'en-cours' && (
          <p className="jeu-message" key={message + score + vies}>
            {message}
          </p>
        )}

        {etat === 'accueil' && (
          <div className="jeu-voile">
            <p>Prêt à nettoyer la plage ?</p>
            <button type="button" className="declarer" onClick={demarrer}>
              ▶️ Jouer
            </button>
          </div>
        )}
        {etat === 'fini' && (
          <div className="jeu-voile">
            {nouveauRecord && <Confettis />}
            <p className="jeu-final">{nouveauRecord ? '🏆 Nouveau record !' : 'Partie terminée'}</p>
            <p>
              {score} déchet{score > 1 ? 's' : ''} ramassé{score > 1 ? 's' : ''} : {titre}
            </p>
            <button type="button" className="declarer" onClick={demarrer}>
              🔁 Rejouer
            </button>
          </div>
        )}
      </div>

      <div className="jeu-commandes">
        <button type="button" className="secondaire" onClick={() => deplacer(ratonRef.current - 12)} aria-label="Aller à gauche">
          ⬅️
        </button>
        <button type="button" className="secondaire" onClick={() => deplacer(ratonRef.current + 12)} aria-label="Aller à droite">
          ➡️
        </button>
      </div>
      <p className="aide source">Le jeu ne rapporte aucun point : les vrais points se gagnent sur la plage. 😉</p>

      <button type="button" className="secondaire" onClick={onRetour}>
        Retour à l'accueil
      </button>
    </section>
  )
}
