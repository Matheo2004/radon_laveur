import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cheminPhoto, liensTemporaires } from '../photo'
import Chargement from '../components/Chargement'

type Declaration = {
  id: number
  created_at: string
  statut: 'en_attente' | 'validee' | 'refusee'
  poids_kg: number | null
  photo_url: string | null
  zone: { code: string; nom: string } | null
}

// Affichage seulement : le vrai calcul des points est fait par la base (fonction points_pour, 10 points par kg).
const pointsAffiches = (poids: number | null) => Math.round((poids ?? 0) * 10)

const LIBELLES = { en_attente: 'En attente de pesée', validee: 'Validée', refusee: 'Refusée' }

type Props = { client: SupabaseClient; userId: string; onPeser: (declarationId: number) => void }

export default function MesDeclarations({ client, userId, onPeser }: Props) {
  const [declarations, setDeclarations] = useState<Declaration[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [liens, setLiens] = useState<Record<string, string>>({})

  useEffect(() => {
    client
      .from('declaration')
      .select('id, created_at, statut, poids_kg, photo_url, zone(code, nom)')
      .eq('profil_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(async ({ data, error }) => {
        if (error) return setErreur(error.message)
        const liste = (data ?? []) as unknown as Declaration[]
        setDeclarations(liste)
        // Photos privées : on demande des liens temporaires pour les afficher.
        const chemins = liste.flatMap((d) => (d.photo_url ? [cheminPhoto(d.photo_url)] : []))
        setLiens(await liensTemporaires(client, chemins))
      })
  }, [client, userId])

  if (erreur) return <p className="erreur">Impossible de charger tes déclarations : {erreur}</p>
  if (declarations === null) return <Chargement texte="Le raton laveur trie tes ramassages…" />
  if (declarations.length === 0) return <p className="aide">Pas encore de ramassage déclaré : à toi de jouer !</p>

  return (
    <ul className="declarations">
      {declarations.map((d) => (
        <li key={d.id} className="declaration">
          {d.photo_url && liens[cheminPhoto(d.photo_url)] && (
            <img src={liens[cheminPhoto(d.photo_url)]} alt="" loading="lazy" />
          )}
          <div>
            <p className="zone-nom">
              <strong>{d.zone?.code}</strong> {d.zone?.nom}
            </p>
            <p className="aide">{new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
            <span className={`badge ${d.statut}`}>
              {LIBELLES[d.statut]}
              {d.statut === 'validee' && ` · ${d.poids_kg} kg · +${pointsAffiches(d.poids_kg)} pts`}
            </span>
            {d.statut === 'en_attente' && (
              <button type="button" className="peser" onClick={() => onPeser(d.id)}>
                Faire peser (QR code)
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
