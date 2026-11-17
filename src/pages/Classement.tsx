import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profil } from '../types'
import Chargement from '../components/Chargement'
import { useDelaiMinimum } from '../useDelaiMinimum'

type Benevole = { id: string; pseudo: string; ecole: string | null; points: number }
type Groupe = { cle: string; nom: string; membres: number; points: number }
type Onglet = 'benevoles' | 'associations' | 'ecoles'

const TAILLE = 50 // nombre de bénévoles affichés

type Props = { client: SupabaseClient; moi: Profil; onRetour: () => void }

const rangTexte = (rang: number) => (rang === 1 ? '1er' : `${rang}e`)
const MEDAILLES = ['🥇', '🥈', '🥉']
const rangAffiche = (i: number) => MEDAILLES[i] ?? String(i + 1)

// US09 : trois classements distincts : bénévoles (comme sur Strava), associations et écoles.
// Seuls le pseudo, l'école, l'association et les points sont publics : aucun e-mail ni nom réel.
export default function Classement({ client, moi, onRetour }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('benevoles')
  const [benevoles, setBenevoles] = useState<Benevole[] | null>(null)
  const [associations, setAssociations] = useState<Groupe[] | null>(null)
  const [ecoles, setEcoles] = useState<Groupe[] | null>(null)
  const [monRang, setMonRang] = useState<number | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const delai = useDelaiMinimum()

  useEffect(() => {
    client
      .from('profil')
      .select('id, pseudo, ecole, points')
      .order('points', { ascending: false })
      .order('pseudo')
      .limit(TAILLE)
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setBenevoles((data ?? []) as Benevole[])
      })

    // Mon rang = nombre de bénévoles qui ont strictement plus de points que moi, + 1.
    client
      .from('profil')
      .select('id', { count: 'exact', head: true })
      .gt('points', moi.points)
      .then(({ count }) => setMonRang((count ?? 0) + 1))

    client
      .from('classement_associations')
      .select('id, nom, benevoles, points')
      .order('points', { ascending: false })
      .then(({ data }) =>
        setAssociations(
          (data ?? []).map((a) => ({ cle: String(a.id), nom: a.nom as string, membres: a.benevoles as number, points: a.points as number })),
        ),
      )

    client
      .from('classement_ecoles')
      .select('ecole, etudiants, points')
      .order('points', { ascending: false })
      .then(({ data }) =>
        setEcoles(
          (data ?? []).map((e) => ({ cle: e.ecole as string, nom: e.ecole as string, membres: e.etudiants as number, points: e.points as number })),
        ),
      )
  }, [client, moi.points])

  const jeSuisDansLaListe = benevoles?.some((b) => b.id === moi.id)

  function listeGroupes(groupes: Groupe[] | null, maCle: string | null, vide: string) {
    if (groupes === null || !delai) return <Chargement texte="Le raton laveur compte les points…" />
    if (groupes.length === 0) return <p className="aide">{vide}</p>
    return (
      <ol className="classement">
        {groupes.map((g, i) => (
          <li key={g.cle} className={g.cle === maCle ? 'moi' : ''} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
            <span className="rang">{rangAffiche(i)}</span>
            <span className="qui">
              <strong>{g.nom}</strong>
              <small>
                {g.membres} bénévole{g.membres > 1 ? 's' : ''}
              </small>
            </span>
            <span className="score">{g.points} pts</span>
          </li>
        ))}
      </ol>
    )
  }

  const onglets: { id: Onglet; libelle: string }[] = [
    { id: 'benevoles', libelle: 'Bénévoles' },
    { id: 'associations', libelle: 'Associations' },
    { id: 'ecoles', libelle: 'Écoles' },
  ]

  return (
    <section className="carte">
      <h2>Classement</h2>

      <div className="onglets" role="tablist">
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={onglet === o.id}
            className={onglet === o.id ? 'actif' : ''}
            onClick={() => setOnglet(o.id)}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      {erreur && <p className="erreur">Impossible de charger le classement : {erreur}</p>}

      {onglet === 'benevoles' && (
        <>
          {monRang !== null && (
            <p className="info">
              Tu es <strong>{rangTexte(monRang)}</strong> avec {moi.points} pts.
            </p>
          )}
          {benevoles === null || !delai ? (
            <Chargement texte="Le raton laveur compte les points…" />
          ) : (
            <ol className="classement">
              {benevoles.map((b, i) => (
                <li key={b.id} className={b.id === moi.id ? 'moi' : ''} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <span className="rang">{rangAffiche(i)}</span>
                  <span className="qui">
                    <strong>{b.pseudo}</strong>
                    <small>{b.ecole}</small>
                  </span>
                  <span className="score">{b.points} pts</span>
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
          )}
        </>
      )}

      {onglet === 'associations' &&
        listeGroupes(
          associations,
          moi.association_id ? String(moi.association_id) : null,
          'Pas encore d’association. Choisis la tienne dans ton profil.',
        )}

      {onglet === 'ecoles' && listeGroupes(ecoles, moi.ecole, 'Pas encore de points par école.')}

      <button type="button" className="secondaire" onClick={onRetour}>
        Retour à l'accueil
      </button>
    </section>
  )
}
