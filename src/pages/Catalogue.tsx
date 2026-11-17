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
  emoji?: string | null // absents tant que la migration 015 n'est pas appliquée
  categorie?: Categorie | null
}
type Categorie = 'gourmandise' | 'sortie' | 'mer' | 'eco' | 'culture'

export const CATEGORIES: Record<Categorie, { libelle: string; emoji: string; couleur: string }> = {
  gourmandise: { libelle: 'Gourmandises', emoji: '🍦', couleur: '#f28c38' },
  sortie: { libelle: 'Sorties', emoji: '🎟️', couleur: '#8b5cf6' },
  mer: { libelle: 'Sport & mer', emoji: '🌊', couleur: '#1d7aa3' },
  eco: { libelle: 'Éco-gestes', emoji: '🌱', couleur: '#2e8b57' },
  culture: { libelle: 'Culture', emoji: '📚', couleur: '#d14d72' },
}
const categorieDe = (b: Bon): Categorie => b.categorie ?? 'sortie'

// points = null : visiteur non connecté, qui découvre les récompenses avant de s'inscrire.
type Props = { client: SupabaseClient; points: number | null; onEchange?: () => void; onRetour: () => void }

// US12 : catalogue des bons d'achat, présentés comme des tickets à détacher, filtrables par catégorie.
// US13 : le bouton « Échanger » appelle echanger_bon, qui débite les points côté serveur et renvoie un code unique.
export default function Catalogue({ client, points, onEchange, onRetour }: Props) {
  const [bons, setBons] = useState<Bon[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const delai = useDelaiMinimum() // le raton laveur a le temps de passer le balai
  const [enCours, setEnCours] = useState<number | null>(null)
  const [obtenu, setObtenu] = useState<{ titre: string; code: string; emoji: string } | null>(null)
  const [version, setVersion] = useState(0) // relance le chargement après un échange (stock à jour)
  const [filtre, setFiltre] = useState<Categorie | 'tous' | 'accessibles'>('tous')

  async function echanger(bon: Bon) {
    if (!window.confirm(`Échanger ${bon.cout_points} pts contre « ${bon.titre} » ?`)) return
    setErreur(null)
    setEnCours(bon.id)
    const { data, error } = await client.rpc('echanger_bon', { p_bon: bon.id })
    setEnCours(null)
    if (error) return setErreur(error.message)
    jouer('fanfare')
    setObtenu({ titre: bon.titre, code: data as string, emoji: bon.emoji ?? '🎁' })
    setVersion((v) => v + 1)
    onEchange?.() // recharge le profil : les points ont été débités par la base
  }

  useEffect(() => {
    client
      .from('bon_achat')
      .select('*')
      .order('cout_points')
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setBons((data ?? []) as Bon[])
      })
  }, [client, version])

  const connecte = points !== null
  const liste = (bons ?? []).filter((b) =>
    filtre === 'tous' ? true : filtre === 'accessibles' ? connecte && b.cout_points <= points && b.stock > 0 : categorieDe(b) === filtre,
  )
  // Le prochain bon à portée : le moins cher que l'on ne peut pas encore s'offrir.
  const prochain = connecte ? (bons ?? []).find((b) => b.stock > 0 && b.cout_points > points) : undefined
  const categoriesPresentes = (Object.keys(CATEGORIES) as Categorie[]).filter((c) => (bons ?? []).some((b) => categorieDe(b) === c))

  return (
    <section className="carte boutique">
      <h2>🎁 La boutique du raton</h2>

      {connecte ? (
        <div className="tirelire">
          <span className="tirelire-cochon" aria-hidden="true">
            🐷
          </span>
          <div>
            <p className="aide">Ma tirelire</p>
            <p className="tirelire-points">
              {points} <small>pts</small>
            </p>
            {prochain && (
              <p className="aide">
                Encore <strong>{prochain.cout_points - points} pts</strong> pour {prochain.emoji ?? '🎁'} {prochain.titre}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="info">Ramasse des déchets sur le littoral, gagne des points et échange-les contre ces récompenses. 10 kg = 100 pts.</p>
      )}

      {obtenu && (
        <div className="ticket-gagne" key={obtenu.code}>
          <Confettis />
          <p className="ticket-gagne-emoji" aria-hidden="true">
            {obtenu.emoji}
          </p>
          <p>
            Bon obtenu : <strong>{obtenu.titre}</strong>
          </p>
          <p className="code-bon">{obtenu.code}</p>
          <p className="aide">Présente ce code au partenaire. Tu le retrouves dans « Mes bons ».</p>
        </div>
      )}

      <div className="filtres" role="tablist" aria-label="Filtrer les bons">
        {[
          { id: 'tous' as const, libelle: 'Tout', emoji: '✨' },
          ...(connecte ? [{ id: 'accessibles' as const, libelle: 'À ma portée', emoji: '✅' }] : []),
          ...categoriesPresentes.map((c) => ({ id: c, libelle: CATEGORIES[c].libelle, emoji: CATEGORIES[c].emoji })),
        ].map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filtre === f.id} className={filtre === f.id ? 'actif' : ''} onClick={() => setFiltre(f.id)}>
            <span aria-hidden="true">{f.emoji}</span> {f.libelle}
          </button>
        ))}
      </div>

      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      {(bons === null || !delai) && !erreur && <Chargement texte="Le raton laveur dépoussière les bons…" />}
      {delai && bons !== null && liste.length === 0 && (
        <p className="aide">{filtre === 'accessibles' ? 'Rien à ta portée pour l’instant : un petit tour sur la plage ? 🏖️' : 'Pas encore de bons ici.'}</p>
      )}

      <ul className="tickets">
        {delai &&
          liste.map((b, i) => {
            const categorie = CATEGORIES[categorieDe(b)]
            const manque = b.cout_points - (points ?? 0)
            const accessible = connecte && manque <= 0 && b.stock > 0
            const progression = connecte ? Math.min(1, (points ?? 0) / b.cout_points) : 0
            return (
              <li
                key={b.id}
                className={`ticket ${accessible ? 'accessible' : ''} ${b.stock === 0 ? 'epuise' : ''}`}
                style={{ ['--couleur' as string]: categorie.couleur, animationDelay: `${Math.min(i, 10) * 50}ms` }}
              >
                <div className="ticket-talon">
                  <span className="ticket-emoji" aria-hidden="true">
                    {b.emoji ?? categorie.emoji}
                  </span>
                  <span className="ticket-cout">
                    {b.cout_points}
                    <small>pts</small>
                  </span>
                </div>
                <div className="ticket-corps">
                  <p className="ticket-categorie">{categorie.libelle}</p>
                  <p className="ticket-titre">{b.titre}</p>
                  {b.description && <p className="ticket-description">{b.description}</p>}
                  <p className="partenaire">
                    📍 {b.partenaire}
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
                  {b.stock > 0 && b.stock <= 5 && <span className="ticket-rare">🔥 Plus que {b.stock} !</span>}

                  {!connecte ? (
                    <span className={`badge ${b.stock === 0 ? 'refusee' : 'validee'}`}>{b.stock === 0 ? 'Épuisé' : `${b.stock} disponibles`}</span>
                  ) : b.stock === 0 ? (
                    <span className="badge refusee">Épuisé, revient bientôt</span>
                  ) : accessible ? (
                    <button type="button" className="peser ticket-bouton" onClick={() => echanger(b)} disabled={enCours !== null}>
                      {enCours === b.id ? 'Échange…' : '✂️ Détacher ce bon'}
                    </button>
                  ) : (
                    <div className="ticket-progression">
                      <div className="ticket-barre">
                        <div style={{ width: `${Math.round(progression * 100)}%` }} />
                      </div>
                      <small>Encore {manque} pts</small>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
      </ul>

      <button type="button" className="secondaire" onClick={onRetour}>
        {connecte ? "Retour à l'accueil" : 'Créer mon compte ou me connecter'}
      </button>
    </section>
  )
}
