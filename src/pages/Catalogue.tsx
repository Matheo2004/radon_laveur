import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Confettis from '../components/Confettis'
import { jouer } from '../fun/sons'
import Chargement from '../components/Chargement'
import { useDelaiMinimum } from '../useDelaiMinimum'

type Bon = {
  id: number
  titre: string
  description: string | null
  partenaire: string | null
  partenaire_adresse: string | null
  partenaire_lien: string | null
  cout_points: number
  stock: number
}

// points = null : visiteur non connecté, qui découvre les récompenses avant de s'inscrire.
type Props = { client: SupabaseClient; points: number | null; onEchange?: () => void; onRetour: () => void }

// US12 : catalogue des bons d'achat et des commerces partenaires (financés par la ville).
// US13 : le bouton « Échanger » appelle echanger_bon, qui débite les points côté serveur et renvoie un code unique.
export default function Catalogue({ client, points, onEchange, onRetour }: Props) {
  const [bons, setBons] = useState<Bon[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const delai = useDelaiMinimum() // le raton laveur a le temps de passer le balai
  const [enCours, setEnCours] = useState<number | null>(null)
  const [obtenu, setObtenu] = useState<{ titre: string; code: string } | null>(null)
  const [version, setVersion] = useState(0) // relance le chargement après un échange (stock à jour)

  async function echanger(bon: Bon) {
    if (!window.confirm(`Échanger ${bon.cout_points} pts contre « ${bon.titre} » ?`)) return
    setErreur(null)
    setEnCours(bon.id)
    const { data, error } = await client.rpc('echanger_bon', { p_bon: bon.id })
    setEnCours(null)
    if (error) return setErreur(error.message)
    jouer('fanfare')
    setObtenu({ titre: bon.titre, code: data as string })
    setVersion((v) => v + 1)
    onEchange?.() // recharge le profil : les points ont été débités par la base
  }

  useEffect(() => {
    client
      .from('bon_achat')
      .select('id, titre, description, partenaire, partenaire_adresse, partenaire_lien, cout_points, stock')
      .order('cout_points')
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setBons((data ?? []) as Bon[])
      })
  }, [client, version])

  return (
    <section className="carte">
      <h2>Bons d'achat</h2>
      <p className="aide">
        {points === null ? (
          <>Ramasse des déchets sur le littoral, gagne des points et échange-les contre ces récompenses.</>
        ) : (
          <>
            Tu as <strong>{points} pts</strong>.
          </>
        )}{' '}
        10 kg de déchets ramassés = 100 pts.
      </p>

      {obtenu && (
        <div className="carte succes" key={obtenu.code}>
          <Confettis />
          <p>
            Bon obtenu : <strong>{obtenu.titre}</strong>
          </p>
          <p className="code-bon">{obtenu.code}</p>
          <p className="aide">Présente ce code au partenaire. Tu le retrouves dans « Mes bons ».</p>
        </div>
      )}
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      {(bons === null || !delai) && !erreur && <Chargement texte="Le raton laveur dépoussière les bons…" />}
      {delai && bons?.length === 0 && <p className="aide">Pas encore de bons disponibles.</p>}

      <ul className="catalogue">
        {delai && bons?.map((b) => {
          const manque = b.cout_points - (points ?? 0)
          return (
            <li key={b.id} className={manque <= 0 && b.stock > 0 ? 'accessible' : ''}>
              <div className="bon-entete">
                <strong>{b.titre}</strong>
                <span className="cout">{b.cout_points} pts</span>
              </div>
              {b.description && <p>{b.description}</p>}
              <p className="partenaire">
                {b.partenaire}
                {b.partenaire_adresse && <> · {b.partenaire_adresse}</>}
                {b.partenaire_lien && (
                  <>
                    {' · '}
                    <a href={b.partenaire_lien} target="_blank" rel="noreferrer">
                      site
                    </a>
                  </>
                )}
              </p>
              {points === null ? (
                <span className={`badge ${b.stock === 0 ? 'refusee' : 'validee'}`}>{b.stock === 0 ? 'Épuisé' : `${b.stock} disponibles`}</span>
              ) : manque <= 0 && b.stock > 0 ? (
                <button type="button" className="peser" onClick={() => echanger(b)} disabled={enCours !== null}>
                  {enCours === b.id ? 'Échange…' : `Échanger ${b.cout_points} pts`}
                </button>
              ) : (
                <span className={`badge ${b.stock === 0 ? 'refusee' : 'en_attente'}`}>
                  {b.stock === 0 ? 'Épuisé' : `Encore ${manque} pts`}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <button type="button" className="secondaire" onClick={onRetour}>
        {points === null ? 'Créer mon compte ou me connecter' : "Retour à l'accueil"}
      </button>
    </section>
  )
}
