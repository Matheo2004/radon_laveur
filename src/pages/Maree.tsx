import { useEffect, useState } from 'react'
import { chargerMaree, heure, jour, type Etat } from '../maree'

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
  if (!etat) return <p className="aide">Chargement des marées…</p>

  const { creneauActuel, prochaine, tendance, creneaux } = etat
  const prochainCreneau = creneaux.find((c) => c !== creneauActuel)

  return (
    <section className="carte maree">
      <h2>🌊 Marées en rade de Brest</h2>

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
