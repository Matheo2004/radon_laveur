import { useEffect, useState } from 'react'
import { chargerMaree, heure, jour, type Etat } from '../maree'
import Chargement from '../components/Chargement'

// Panneau « Marées » : quand ramasser ? Autour de la marée basse, l'estran découvert est plus grand
// et on évite d'être surpris par la mer qui monte.
export default function Maree() {
  const [etat, setEtat] = useState<Etat | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    chargerMaree()
      .then(setEtat)
      .catch((e: Error) => setErreur(e.message))
  }, [])

  if (erreur) return <p className="aide">Marées : {erreur}</p>
  if (!etat) return <Chargement texte="Le raton laveur guette la marée…" />

  const { creneauActuel, prochaine, tendance, creneaux, niveau } = etat
  const prochainCreneau = creneaux.find((c) => c !== creneauActuel)

  return (
    <section className="carte maree">
      <div className="maree-tete">
        <h2>🌊 Marées en rade de Brest</h2>
        {/* Jauge animée : la hauteur d'eau actuelle entre la plus basse et la plus haute mer prévues */}
        <div className="jauge" role="img" aria-label={`Niveau de la mer : ${Math.round(niveau * 100)} %, mer ${tendance}`}>
          <div className="jauge-eau" style={{ height: `${Math.round(12 + niveau * 76)}%` }}>
            <svg viewBox="0 0 120 20" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0,10 C20,0 40,20 60,10 C80,0 100,20 120,10 L120,20 L0,20 Z" />
            </svg>
          </div>
          <span className="jauge-fleche" aria-hidden="true">{tendance === 'montante' ? '▲' : '▼'}</span>
        </div>
      </div>

      {creneauActuel ? (
        <p className="maree-etat bon">
          Bon moment pour ramasser : marée basse à {heure(creneauActuel.basse)}, jusqu'à {heure(creneauActuel.fin)}.
        </p>
      ) : (
        <p className="maree-etat attendre">
          Mer {tendance === 'montante' ? 'montante' : 'descendante'} : l'estran est en partie couvert.
          {prochainCreneau && <> Prochain créneau {jour(prochainCreneau.debut)} de {heure(prochainCreneau.debut)} à {heure(prochainCreneau.fin)}.</>}
        </p>
      )}

      {tendance === 'montante' && creneauActuel && creneauActuel.basse.getTime() < Date.now() && (
        <p className="erreur">La mer remonte : garde un œil sur ta sortie, ne t'avance pas sur les rochers.</p>
      )}

      {prochaine && (
        <p className="aide">
          Prochaine marée {prochaine.type} : {jour(prochaine.heure)} à {heure(prochaine.heure)}.
        </p>
      )}

      <h3>Créneaux conseillés (marée basse ± 2 h)</h3>
      <ul className="creneaux">
        {creneaux.slice(0, 4).map((c) => (
          <li key={c.basse.toISOString()} className={c.deJour ? '' : 'nuit'}>
            <span>{jour(c.debut)}</span>
            <strong>
              {heure(c.debut)} – {heure(c.fin)}
            </strong>
            {!c.deJour && <small>de nuit</small>}
          </li>
        ))}
      </ul>
      <p className="aide source">Prévisions indicatives (Open-Meteo), à ne pas utiliser pour la navigation.</p>
    </section>
  )
}
