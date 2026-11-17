import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profil } from '../types'

type Ligne = { id: string; pseudo: string; ecole: string | null; points: number }
type Ecole = { ecole: string; etudiants: number; points: number }
type Onglet = 'etudiants' | 'ecoles'

const TAILLE = 50 // nombre de bénévoles affichés

type Props = { client: SupabaseClient; moi: Profil; onRetour: () => void }

// US09 : classement des bénévoles (comme sur Strava) et classement par école.
// Seuls le pseudo, l'école et les points sont publics : aucun e-mail ni nom réel.
export default function Classement({ client, moi, onRetour }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('etudiants')
  const [lignes, setLignes] = useState<Ligne[] | null>(null)
  const [ecoles, setEcoles] = useState<Ecole[] | null>(null)
  const [monRang, setMonRang] = useState<number | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    client
      .from('profil')
      .select('id, pseudo, ecole, points')
      .order('points', { ascending: false })
      .order('pseudo')
      .limit(TAILLE)
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setLignes((data ?? []) as Ligne[])
      })

    // Mon rang = nombre de bénévoles qui ont strictement plus de points que moi, + 1.
    client
      .from('profil')
      .select('id', { count: 'exact', head: true })
      .gt('points', moi.points)
      .then(({ count }) => setMonRang((count ?? 0) + 1))

    client
      .from('classement_ecoles')
      .select('ecole, etudiants, points')
      .order('points', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setEcoles((data ?? []) as Ecole[])
      })
  }, [client, moi.points])

  const jeSuisDansLaListe = lignes?.some((l) => l.id === moi.id)

  return (
    <section className="carte">
      <h2>Classement</h2>
      {monRang !== null && (
        <p className="info">
          Tu es <strong>{monRang === 1 ? '1er' : `${monRang}e`}</strong> avec {moi.points} pts.
        </p>
      )}

      <div className="onglets" role="tablist">
        <button type="button" role="tab" aria-selected={onglet === 'etudiants'} className={onglet === 'etudiants' ? 'actif' : ''} onClick={() => setOnglet('etudiants')}>
          Bénévoles
        </button>
        <button type="button" role="tab" aria-selected={onglet === 'ecoles'} className={onglet === 'ecoles' ? 'actif' : ''} onClick={() => setOnglet('ecoles')}>
          Écoles
        </button>
      </div>

      {erreur && <p className="erreur">Impossible de charger le classement : {erreur}</p>}

      {onglet === 'etudiants' &&
        (lignes === null ? (
          <p className="aide">Chargement…</p>
        ) : (
          <ol className="classement">
            {lignes.map((l, i) => (
              <li key={l.id} className={l.id === moi.id ? 'moi' : ''}>
                <span className="rang">{i + 1}</span>
                <span className="qui">
                  <strong>{l.pseudo}</strong>
                  <small>{l.ecole}</small>
                </span>
                <span className="score">{l.points} pts</span>
              </li>
            ))}
            {!jeSuisDansLaListe && monRang !== null && (
              <li className="moi">
                <span className="rang">{monRang}</span>
                <span className="qui">
                  <strong>{moi.pseudo}</strong>
                  <small>{moi.ecole}</small>
                </span>
                <span className="score">{moi.points} pts</span>
              </li>
            )}
          </ol>
        ))}

      {onglet === 'ecoles' &&
        (ecoles === null ? (
          <p className="aide">Chargement…</p>
        ) : ecoles.length === 0 ? (
          <p className="aide">Pas encore de points par école.</p>
        ) : (
          <ol className="classement">
            {ecoles.map((e, i) => (
              <li key={e.ecole} className={e.ecole === moi.ecole ? 'moi' : ''}>
                <span className="rang">{i + 1}</span>
                <span className="qui">
                  <strong>{e.ecole}</strong>
                  <small>
                    {e.etudiants} bénévole{e.etudiants > 1 ? 's' : ''}
                  </small>
                </span>
                <span className="score">{e.points} pts</span>
              </li>
            ))}
          </ol>
        ))}

      <button type="button" className="secondaire" onClick={onRetour}>
        Retour à l'accueil
      </button>
    </section>
  )
}
