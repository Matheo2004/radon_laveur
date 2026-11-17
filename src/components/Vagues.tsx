// En-tête animé : la rade de Brest en vagues superposées qui ondulent doucement.
export default function Vagues({ compact }: { compact?: boolean }) {
  return (
    <header className={`entete ${compact ? 'compact' : ''}`}>
      <div className="entete-contenu">
        <div className="logo" aria-hidden="true">
          <span className="logo-goutte">🦝</span>
        </div>
        <div>
          <h1>Radon Laveur</h1>
          <p className="slogan">Ramassons main dans la main</p>
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
