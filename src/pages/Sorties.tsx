import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profil } from '../types'

export type Sortie = {
  id: number
  zone_id: number
  zone_code: string
  zone_nom: string
  organisateur_type: 'association' | 'ecole'
  organisateur_nom: string
  debut: string
  fin: string
  places: number | null
  inscrits: number
  rendez_vous: string
  description: string | null
  cree_par: string
}

type Props = { client: SupabaseClient; moi: Profil; onCreer: () => void; onRetour: () => void }

const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// Deux sorties se chevauchent si elles visent la même zone sur des créneaux qui se recouvrent.
export const seChevauchent = (a: { zone_id: number; debut: string; fin: string }, b: { zone_id: number; debut: string; fin: string }) =>
  a.zone_id === b.zone_id && new Date(a.debut) < new Date(b.fin) && new Date(b.debut) < new Date(a.fin)

// Sorties de groupe : une association ou une école réserve un créneau, tout le monde peut la rejoindre.
export default function Sorties({ client, moi, onCreer, onRetour }: Props) {
  const [sorties, setSorties] = useState<Sortie[] | null>(null)
  const [mesInscriptions, setMesInscriptions] = useState<Set<number>>(new Set())
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState<number | null>(null)
  const [version, setVersion] = useState(0)
  const [estDirigeant, setEstDirigeant] = useState<boolean | null>(null)

  useEffect(() => {
    client
      .from('sortie_details')
      .select('*')
      .gte('fin', new Date().toISOString())
      .order('debut')
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setSorties((data ?? []) as Sortie[])
      })
    client
      .from('dirigeant')
      .select('id', { count: 'exact', head: true })
      .eq('profil_id', moi.id)
      .eq('statut', 'valide')
      .then(({ count }) => setEstDirigeant((count ?? 0) > 0))
    client
      .from('inscription')
      .select('sortie_id')
      .eq('profil_id', moi.id)
      .then(({ data }) => setMesInscriptions(new Set((data ?? []).map((i) => i.sortie_id as number))))
  }, [client, moi.id, version])

  async function participer(s: Sortie) {
    setErreur(null)
    setEnCours(s.id)
    const { error } = await client.from('inscription').insert({ sortie_id: s.id, profil_id: moi.id })
    setEnCours(null)
    if (error) return setErreur(error.code === '23505' ? 'Tu participes déjà à cette sortie.' : error.message)
    setVersion((v) => v + 1)
  }

  async function quitter(s: Sortie) {
    setErreur(null)
    setEnCours(s.id)
    const { error } = await client.from('inscription').delete().eq('sortie_id', s.id).eq('profil_id', moi.id)
    setEnCours(null)
    if (error) return setErreur(error.message)
    setVersion((v) => v + 1)
  }

  async function annuler(s: Sortie) {
    if (!window.confirm(`Annuler la sortie du ${dateHeure(s.debut)} ? Les inscrits ne la verront plus.`)) return
    setEnCours(s.id)
    const { error } = await client.from('sortie').delete().eq('id', s.id)
    setEnCours(null)
    if (error) return setErreur(error.message)
    setVersion((v) => v + 1)
  }


  return (
    <section className="carte">
      <h2>Sorties de groupe</h2>
      <p className="aide">Une association ou une école réserve un créneau sur une zone : tout le monde peut la rejoindre.</p>

      {estDirigeant ? (
        <button type="button" className="declarer" onClick={onCreer}>
          Réserver un créneau
        </button>
      ) : (
        estDirigeant === false && (
          <p className="info">
            Seuls les dirigeants d'une école ou d'une association réservent des créneaux. Demande-le dans « Modifier mon profil », ou ajoute
            ton école ou ton association si elle manque.
          </p>
        )
      )}

      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      {sorties === null && !erreur && <p className="aide">Chargement…</p>}
      {sorties?.length === 0 && <p className="aide">Aucune sortie prévue pour l'instant. Lance la première !</p>}

      <ul className="sorties">
        {sorties?.map((s) => {
          const inscrit = mesInscriptions.has(s.id)
          const complet = s.places !== null && s.inscrits >= s.places
          const autres = sorties.filter((o) => o.id !== s.id && seChevauchent(o, s))
          return (
            <li key={s.id} className={inscrit ? 'inscrit' : ''}>
              <p className="sortie-quand">
                {dateHeure(s.debut)} – {heure(s.fin)}
              </p>
              <p>
                <strong>
                  {s.zone_code} · {s.zone_nom}
                </strong>
              </p>
              <p className="aide">
                Organisée par {s.organisateur_nom} ({s.organisateur_type === 'ecole' ? 'école' : 'association'})
              </p>
              <p className="aide">Rendez-vous : {s.rendez_vous}</p>
              {s.description && <p>{s.description}</p>}
              {autres.length > 0 && (
                <p className="info">⚠️ Une autre sortie est prévue au même moment sur cette zone ({autres[0].organisateur_nom}).</p>
              )}
              <p className="aide">
                {s.inscrits} participant{s.inscrits > 1 ? 's' : ''}
                {s.places !== null && ` sur ${s.places} places`}
              </p>
              {inscrit ? (
                s.cree_par === moi.id ? (
                  <button type="button" className="secondaire" onClick={() => annuler(s)} disabled={enCours !== null}>
                    Annuler ma sortie
                  </button>
                ) : (
                  <button type="button" className="secondaire" onClick={() => quitter(s)} disabled={enCours !== null}>
                    Je ne viens plus
                  </button>
                )
              ) : (
                <button type="button" className="peser" onClick={() => participer(s)} disabled={enCours !== null || complet}>
                  {complet ? 'Complet' : enCours === s.id ? 'Inscription…' : 'Je participe'}
                </button>
              )}
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
