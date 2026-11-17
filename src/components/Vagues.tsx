import { useEffect, useState } from 'react'
import Confettis from './Confettis'
import { activerSon, jouer, sonActif } from '../fun/sons'

type Moment = 'aube' | 'jour' | 'crepuscule' | 'nuit'
const momentDuJour = (h: number): Moment => (h >= 6 && h < 9 ? 'aube' : h >= 9 && h < 18 ? 'jour' : h >= 18 && h < 21 ? 'crepuscule' : 'nuit')

// En-tête animé : le ciel de la rade change avec l'heure (aube, jour, crépuscule, nuit étoilée),
// une mouette passe, un poisson saute. Secret : 5 touches sur le logo lancent la fête des ratons laveurs.
export default function Vagues({ compact }: { compact?: boolean }) {
  const [touches, setTouches] = useState(0)
  const [fete, setFete] = useState(0)
  const [enFete, setEnFete] = useState(false)
  const [son, setSon] = useState(sonActif())
  const [moment, setMoment] = useState<Moment>(momentDuJour(new Date().getHours()))

  // Le ciel se met à jour toutes les 5 minutes.
  useEffect(() => {
    const minuteur = window.setInterval(() => setMoment(momentDuJour(new Date().getHours())), 5 * 60 * 1000)
    return () => window.clearInterval(minuteur)
  }, [])

  // La fête dure 5 secondes, puis la rade redevient calme.
  useEffect(() => {
    if (!fete) return
    setEnFete(true)
    jouer('fanfare')
    const minuteur = window.setTimeout(() => setEnFete(false), 5000)
    return () => window.clearTimeout(minuteur)
  }, [fete])

  function toucherLogo() {
    const n = touches + 1
    jouer('plop')
    if (n >= 5) {
      setFete((f) => f + 1)
      setTouches(0)
    } else {
      setTouches(n)
    }
  }

  function basculerSon() {
    activerSon(!son)
    setSon(!son)
  }

  return (
    <header className={`entete ciel-${moment} ${compact ? 'compact' : ''} ${enFete ? 'en-fete' : ''}`}>
      {enFete && <Confettis key={fete} nombre={60} />}
      {moment === 'nuit' && (
        <div className="etoiles" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 53) % 100}%`, top: `${(i * 29) % 70}%`, animationDelay: `${(i % 6) * 0.4}s` }} />
          ))}
        </div>
      )}
      <span className="astre" aria-hidden="true">
        {moment === 'nuit' ? '🌙' : moment === 'crepuscule' ? '🌇' : '☀️'}
      </span>
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
        <div className="entete-titre">
          <h1>Radon Laveur</h1>
          <p className="slogan">{enFete ? '🎉 La fête des ratons laveurs ! 🎉' : 'Ramassons main dans la main'}</p>
        </div>
        <button type="button" className="bouton-son" onClick={basculerSon} aria-pressed={son} aria-label={son ? 'Couper les bruitages' : 'Activer les bruitages'}>
          {son ? '🔊' : '🔈'}
        </button>
      </div>
      <svg className="vagues" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="vague v1" d="M0,64 C240,112 480,16 720,64 C960,112 1200,16 1440,64 L1440,120 L0,120 Z" />
        <path className="vague v2" d="M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,120 L0,120 Z" />
        <path className="vague v3" d="M0,96 C240,72 480,120 720,96 C960,72 1200,120 1440,96 L1440,120 L0,120 Z" />
      </svg>
    </header>
  )
}
