import { useEffect, useState } from 'react'

// Messages qui défilent sur l'écran de démarrage, pendant que la barre se remplit.
const ETAPES = [
  'Le raton laveur enfile ses gants…',
  'Il attrape son balai…',
  'Il chasse les déchets de la plage…',
  'Encore un petit coup de balai…',
  'Place nette, on y va !',
]

type Props = {
  texte?: string
  // Écran de démarrage : grand raton, messages qui défilent et barre de progression sur `duree` ms.
  duree?: number
}

// Écran d'attente : notre mascotte, un raton laveur, passe le balai sur la plage
// pendant que les données arrivent. Dessin SVG fait main, animé en CSS (voir .raton dans index.css).
export default function Chargement({ texte = 'Le raton laveur fait place nette…', duree }: Props) {
  const [etape, setEtape] = useState(0)

  useEffect(() => {
    if (!duree) return
    const pas = duree / ETAPES.length
    const minuteur = window.setInterval(() => setEtape((e) => Math.min(e + 1, ETAPES.length - 1)), pas)
    return () => window.clearInterval(minuteur)
  }, [duree])

  return (
    <div className={`chargement ${duree ? 'demarrage' : ''}`} role="status" aria-live="polite">
      <svg className="raton" viewBox="0 0 220 110" aria-hidden="true">
        {/* Sable */}
        <path className="raton-sable" d="M0,96 Q55,90 110,96 T220,96 L220,110 L0,110 Z" />

        {/* Déchets qui arrivent de la droite et se font balayer */}
        <g className="raton-dechets">
          <rect className="dechet d1" x="196" y="86" width="7" height="10" rx="2" />
          <circle className="dechet d2" cx="214" cy="91" r="3.5" />
          <path className="dechet d3" d="M204,94 l6,-6 l3,6 z" />
        </g>

        {/* Nuage de poussière soulevé par le balai */}
        <g className="raton-poussiere">
          <circle className="p1" cx="150" cy="90" r="4" />
          <circle className="p2" cx="158" cy="86" r="3" />
          <circle className="p3" cx="164" cy="92" r="2.5" />
        </g>

        <g className="raton-corps">
          {/* Queue rayée */}
          <g className="raton-queue">
            <path d="M58,74 C36,70 26,56 30,44 C34,56 44,64 60,66 Z" fill="#7d838c" />
            <path d="M33,52 C37,58 41,61 46,63 L43,67 C38,64 34,60 31,55 Z" fill="#2c3036" />
            <path d="M40,60 C45,63 50,64 55,65 L54,69 C49,68 44,66 39,64 Z" fill="#2c3036" />
          </g>
          {/* Corps et ventre */}
          <ellipse cx="80" cy="72" rx="26" ry="20" fill="#8a9099" />
          <ellipse cx="86" cy="76" rx="15" ry="12" fill="#c9ced4" />
          {/* Pattes */}
          <rect className="raton-patte pa1" x="66" y="86" width="8" height="10" rx="4" fill="#2c3036" />
          <rect className="raton-patte pa2" x="88" y="86" width="8" height="10" rx="4" fill="#2c3036" />
          {/* Tête */}
          <g className="raton-tete">
            <path d="M88,30 L94,18 L100,30 Z" fill="#6f757d" />
            <path d="M110,30 L118,19 L121,33 Z" fill="#6f757d" />
            <ellipse cx="106" cy="44" rx="19" ry="16" fill="#9aa0a8" />
            {/* Masque noir et sourcils blancs */}
            <path d="M88,42 C94,34 118,34 124,42 C120,50 112,48 106,46 C100,48 92,50 88,42 Z" fill="#2c3036" />
            <ellipse cx="98" cy="36" rx="5" ry="2" fill="#f2f4f6" />
            <ellipse cx="114" cy="36" rx="5" ry="2" fill="#f2f4f6" />
            <circle className="raton-oeil" cx="99" cy="42" r="2.4" fill="#fff" />
            <circle className="raton-oeil" cx="113" cy="42" r="2.4" fill="#fff" />
            {/* Museau */}
            <ellipse cx="117" cy="52" rx="9" ry="6" fill="#e3e6ea" />
            <circle cx="124" cy="51" r="2.6" fill="#1d2025" />
          </g>
          {/* Bras qui tiennent le balai */}
          <path d="M96,66 C108,64 116,66 124,72" stroke="#5f656d" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>

        {/* Balai : il pivote autour des mains du raton */}
        <g className="raton-balai">
          <line x1="122" y1="58" x2="150" y2="88" stroke="#a0673a" strokeWidth="4" strokeLinecap="round" />
          <path d="M142,84 L160,82 L166,98 L140,98 Z" fill="#f2b84b" />
          <path d="M146,98 L147,88 M152,98 L152,86 M158,98 L157,85 M163,98 L161,86" stroke="#d9952b" strokeWidth="1.5" />
          <rect x="140" y="80" width="21" height="5" rx="2" fill="#2e8b57" transform="rotate(-6 150 82)" />
        </g>
      </svg>
      {duree ? (
        <>
          <p key={etape} className="etape">
            {ETAPES[etape]}
          </p>
          <div className="progression" aria-hidden="true">
            <div className="progression-barre" style={{ animationDuration: `${duree}ms` }} />
          </div>
        </>
      ) : (
        <p>{texte}</p>
      )}
    </div>
  )
}
