import { useEffect, useState } from 'react'
import Confettis from './Confettis'

// En-tête animé : la rade en vagues, une mouette qui passe, un poisson qui saute.
// Petit secret : touche 5 fois le logo pour lancer la fête des ratons laveurs.
export default function Vagues({ compact }: { compact?: boolean }) {
  const [touches, setTouches] = useState(0)
  const [fete, setFete] = useState(0) // change à chaque fête pour relancer l'animation
  const [enFete, setEnFete] = useState(false)

  // La fête dure 5 secondes, puis la rade redevient calme.
  useEffect(() => {
    if (!fete) return
    setEnFete(true)
    const minuteur = window.setTimeout(() => setEnFete(false), 5000)
    return () => window.clearTimeout(minuteur)
  }, [fete])

  function toucherLogo() {
    const n = touches + 1
    if (n >= 5) {
      setFete((f) => f + 1)
      setTouches(0)
    } else {
      setTouches(n)
    }
  }

  return (
    <header className={`entete ${compact ? 'compact' : ''} ${enFete ? 'en-fete' : ''}`}>
      {enFete && <Confettis key={fete} nombre={60} />}
      <span className="mouette" aria-hidden="true">
        🕊️
      </span>
      <span className="poisson" aria-hidden="true">
        🐟
      </span>
      <div className="entete-contenu">
        <button type="button" className="logo" onClick={toucherLogo} aria-label="Logo Radon Laveur">
          <span className="logo-goutte" aria-hidden="true">
            🦝
          </span>
        </button>
        <div>
          <h1>Radon Laveur</h1>
          <p className="slogan">{enFete ? '🎉 La fête des ratons laveurs ! 🎉' : 'Ramassons main dans la main'}</p>
        </div>
      </div>
      <svg className="vagues" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="vague v1" d="M0,64 C240,112 480,16 720,64 C960,112 1200,16 1440,64 L1440,120 L0,120 Z" />
        <path className="vague v2" d="M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,120 L0,120 Z" />
        <path className="vague v3" d="M0,96 C240,72 480,120 720,96 C960,72 1200,120 1440,96 L1440,120 L0,120 Z" />
      </svg>
    </header>
  )
}
