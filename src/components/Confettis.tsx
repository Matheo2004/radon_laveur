// Petite fête visuelle pour les réussites (pesée validée, bon obtenu) : des confettis aux couleurs du logo.
const COULEURS = ['#0B4F6C', '#2E8B57', '#F28C38', '#5FB3D9', '#F6C453']

export default function Confettis({ nombre = 36 }: { nombre?: number }) {
  return (
    <div className="confettis" aria-hidden="true">
      {Array.from({ length: nombre }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 97) % 100}%`,
            background: COULEURS[i % COULEURS.length],
            animationDelay: `${(i % 12) * 0.06}s`,
            animationDuration: `${1.6 + (i % 5) * 0.25}s`,
            transform: `rotate(${(i * 47) % 360}deg)`,
          }}
        />
      ))}
    </div>
  )
}
