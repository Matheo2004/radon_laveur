import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Chargement from '../components/Chargement'
import { useDelaiMinimum } from '../useDelaiMinimum'
import { CATEGORIES } from './Catalogue'

type Echange = {
  id: number
  code_bon: string
  created_at: string
  bon_achat: {
    titre: string
    partenaire: string | null
    partenaire_adresse: string | null
    emoji?: string | null
    categorie?: keyof typeof CATEGORIES | null
  } | null
}

// Un faux code-barres décoratif, dessiné à partir des caractères du code (le partenaire lit le code en clair).
function CodeBarres({ code }: { code: string }) {
  const barres = code
    .replace(/[^A-Z0-9]/gi, '')
    .split('')
    .flatMap((c) => {
      const n = c.charCodeAt(0)
      return [1 + (n % 3), 1 + ((n >> 2) % 2), 2 + ((n >> 1) % 3)]
    })
  return (
    <div className="code-barres" aria-hidden="true">
      {barres.map((largeur, i) => (
        <span key={i} style={{ width: `${largeur}px`, opacity: i % 2 === 0 ? 1 : 0 }} />
      ))}
    </div>
  )
}

// US13 : les bons obtenus, présentés comme des tickets à montrer au partenaire (visibles par leur seul propriétaire, règle RLS).
// Toucher un ticket l'agrandit pour le présenter en caisse.
export default function MesBons({ client, onRetour }: { client: SupabaseClient; onRetour: () => void }) {
  const [echanges, setEchanges] = useState<Echange[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [agrandi, setAgrandi] = useState<number | null>(null)
  const delai = useDelaiMinimum()

  useEffect(() => {
    client
      .from('echange')
      .select('id, code_bon, created_at, bon_achat(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setEchanges((data ?? []) as unknown as Echange[])
      })
  }, [client])

  return (
    <section className="carte">
      <h2>🎟️ Mes bons</h2>
      {erreur && <p className="erreur">Impossible de charger tes bons : {erreur}</p>}
      {(echanges === null || !delai) && !erreur && <Chargement texte="Le raton laveur cherche tes bons…" />}
      {delai && echanges?.length === 0 && <p className="aide">Pas encore de bon : échange tes points dans la boutique du raton. 🎁</p>}
      {delai && echanges && echanges.length > 0 && <p className="aide">Touche un ticket pour l’agrandir et le montrer au partenaire.</p>}

      <ul className="tickets mes-tickets">
        {delai &&
          echanges?.map((e, i) => {
            const categorie = CATEGORIES[e.bon_achat?.categorie ?? 'sortie']
            return (
              <li
                key={e.id}
                className={`ticket ticket-obtenu ${agrandi === e.id ? 'agrandi' : ''}`}
                style={{ ['--couleur' as string]: categorie.couleur, animationDelay: `${Math.min(i, 10) * 50}ms` }}
              >
                <button type="button" className="ticket-zone" onClick={() => setAgrandi(agrandi === e.id ? null : e.id)} aria-expanded={agrandi === e.id}>
                  <div className="ticket-talon">
                    <span className="ticket-emoji" aria-hidden="true">
                      {e.bon_achat?.emoji ?? categorie.emoji}
                    </span>
                    <span className="ticket-valide">VALIDE</span>
                  </div>
                  <div className="ticket-corps">
                    <p className="ticket-titre">{e.bon_achat?.titre}</p>
                    <p className="partenaire">
                      📍 {e.bon_achat?.partenaire}
                      {e.bon_achat?.partenaire_adresse && <> · {e.bon_achat.partenaire_adresse}</>}
                    </p>
                    <p className="code-bon">{e.code_bon}</p>
                    <CodeBarres code={e.code_bon} />
                    <p className="aide">Obtenu le {new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </button>
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
