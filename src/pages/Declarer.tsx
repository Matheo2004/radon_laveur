import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Zone = { id: number; code: string; nom: string; commune: string }

type Props = {
  client: SupabaseClient
  userId: string
  onTermine: () => void
  onAnnuler: () => void
}

const TAILLE_MAX = 10 * 1024 * 1024 // 10 Mo, comme la limite du bucket

// US06a : l'étudiant choisit la zone, prend une photo et envoie sa déclaration.
// La déclaration part « en attente » : le poids et la validation viendront de la pesée (US07).
export default function Declarer({ client, userId, onTermine, onAnnuler }: Props) {
  const [zones, setZones] = useState<Zone[]>([])
  const [zoneId, setZoneId] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    client
      .from('zone')
      .select('id, code, nom, commune')
      .order('code')
      .then(({ data, error }) => {
        if (error) setErreur(`Impossible de charger les zones : ${error.message}`)
        else setZones((data ?? []) as Zone[])
      })
  }, [client])

  // Libère l'aperçu de l'ancienne photo quand elle change ou que l'écran se ferme.
  useEffect(() => {
    return () => {
      if (apercu) URL.revokeObjectURL(apercu)
    }
  }, [apercu])

  function choisirPhoto(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0] ?? null
    setErreur(null)
    if (fichier && !fichier.type.startsWith('image/')) {
      setErreur('Le fichier doit être une photo.')
      return
    }
    if (fichier && fichier.size > TAILLE_MAX) {
      setErreur('Photo trop lourde : 10 Mo maximum.')
      return
    }
    setPhoto(fichier)
    setApercu(fichier ? URL.createObjectURL(fichier) : null)
  }

  async function valider(e: FormEvent) {
    e.preventDefault()
    if (!zoneId) return setErreur('Choisis la zone où tu as ramassé.')
    if (!photo) return setErreur('Ajoute une photo de ton ramassage.')

    setErreur(null)
    setEnvoi(true)

    // 1. La photo va dans le dossier de l'étudiant : photos/<id>/<identifiant unique>.<ext>
    const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
    const chemin = `${userId}/${crypto.randomUUID()}.${extension}`
    const envoiPhoto = await client.storage.from('photos').upload(chemin, photo, { contentType: photo.type })
    if (envoiPhoto.error) {
      setEnvoi(false)
      return setErreur(`Envoi de la photo impossible : ${envoiPhoto.error.message}`)
    }
    const photoUrl = client.storage.from('photos').getPublicUrl(chemin).data.publicUrl

    // 2. La déclaration : seules ces colonnes sont autorisées depuis le navigateur (statut et poids restent côté serveur).
    const { error } = await client
      .from('declaration')
      .insert({ profil_id: userId, zone_id: Number(zoneId), photo_url: photoUrl })

    setEnvoi(false)
    if (error) return setErreur(`Déclaration impossible : ${error.message}`)
    onTermine()
  }

  return (
    <section className="carte">
      <h2>Déclarer un ramassage</h2>
      <p className="aide">Ta déclaration sera validée après la pesée au point de collecte.</p>

      <form onSubmit={valider}>
        <label>
          Zone
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
            <option value="">Choisis la zone…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.code} · {z.nom} ({z.commune})
              </option>
            ))}
          </select>
        </label>

        <label>
          Photo du ramassage
          {/* capture="environment" ouvre directement l'appareil photo arrière sur téléphone */}
          <input type="file" accept="image/*" capture="environment" onChange={choisirPhoto} />
        </label>
        {apercu && <img className="apercu" src={apercu} alt="Aperçu de la photo du ramassage" />}

        {erreur && <p className="erreur" role="alert">{erreur}</p>}

        <button type="submit" className="principal" disabled={envoi}>
          {envoi ? 'Envoi en cours…' : 'Envoyer ma déclaration'}
        </button>
        <button type="button" className="secondaire" onClick={onAnnuler} disabled={envoi}>
          Annuler
        </button>
      </form>
    </section>
  )
}
