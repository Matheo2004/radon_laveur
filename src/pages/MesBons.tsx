import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Chargement from '../components/Chargement'

type Echange = {
  id: number
  code_bon: string
  created_at: string
  bon_achat: { titre: string; partenaire: string | null; partenaire_adresse: string | null } | null
}

// US13 : les bons obtenus et leur code à présenter au partenaire (visibles par leur seul propriétaire, règle RLS).
export default function MesBons({ client, onRetour }: { client: SupabaseClient; onRetour: () => void }) {
  const [echanges, setEchanges] = useState<Echange[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    client
      .from('echange')
      .select('id, code_bon, created_at, bon_achat(titre, partenaire, partenaire_adresse)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setEchanges((data ?? []) as unknown as Echange[])
      })
  }, [client])

  return (
    <section className="carte">
      <h2>Mes bons</h2>
      {erreur && <p className="erreur">Impossible de charger tes bons : {erreur}</p>}
      {echanges === null && !erreur && <Chargement texte="Le raton laveur cherche tes bons…" />}
      {echanges?.length === 0 && <p className="aide">Pas encore de bon : échange tes points dans « Bons d'achat ».</p>}
      <ul className="catalogue">
        {echanges?.map((e) => (
          <li key={e.id}>
            <strong>{e.bon_achat?.titre}</strong>
            <p className="partenaire">
              {e.bon_achat?.partenaire}
              {e.bon_achat?.partenaire_adresse && <> · {e.bon_achat.partenaire_adresse}</>}
            </p>
            <p className="code-bon">{e.code_bon}</p>
            <p className="aide">Obtenu le {new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </li>
        ))}
      </ul>
      <button type="button" className="secondaire" onClick={onRetour}>
        Retour à l'accueil
      </button>
    </section>
  )
}
