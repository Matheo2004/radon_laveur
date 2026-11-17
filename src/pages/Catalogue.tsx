import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

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

type Props = { client: SupabaseClient; points: number; onRetour: () => void }

// US12 : catalogue des bons d'achat et des commerces partenaires (financés par la ville).
// L'échange des points contre un bon arrive avec US13 : ici, l'étudiant voit ce qu'il peut gagner.
export default function Catalogue({ client, points, onRetour }: Props) {
  const [bons, setBons] = useState<Bon[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    client
      .from('bon_achat')
      .select('id, titre, description, partenaire, partenaire_adresse, partenaire_lien, cout_points, stock')
      .order('cout_points')
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setBons((data ?? []) as Bon[])
      })
  }, [client])

  return (
    <section className="carte">
      <h2>Bons d'achat</h2>
      <p className="aide">
        Tu as <strong>{points} pts</strong>. 10 kg de déchets ramassés = 100 pts.
      </p>

      {erreur && <p className="erreur">Impossible de charger le catalogue : {erreur}</p>}
      {bons === null && !erreur && <p className="aide">Chargement…</p>}
      {bons?.length === 0 && <p className="aide">Pas encore de bons disponibles.</p>}

      <ul className="catalogue">
        {bons?.map((b) => {
          const manque = b.cout_points - points
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
              <span className={`badge ${b.stock === 0 ? 'refusee' : manque <= 0 ? 'validee' : 'en_attente'}`}>
                {b.stock === 0 ? 'Épuisé' : manque <= 0 ? 'Tu peux l’obtenir !' : `Encore ${manque} pts`}
              </span>
            </li>
          )
        })}
      </ul>

      <button type="button" className="secondaire" onClick={onRetour}>
        Retour à l'accueil
      </button>
    </section>
  )
}
