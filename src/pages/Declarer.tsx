import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Zone = { id: number; code: string; nom: string; commune: string; latitude: number; longitude: number; longueur_km: number | null }
type Position = { latitude: number; longitude: number; precision: number }

// Même règle que la base (verifier_position) : demi-longueur de la zone + 500 m autour de son centre.
// Ici, c'est seulement pour prévenir l'étudiant avant l'envoi ; la base refait le contrôle.
const rayonM = (z: Zone) => (z.longueur_km ?? 3) * 500 + 500
function distanceM(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

type Props = {
  client: SupabaseClient
  userId: string
  onTermine: () => void
  onAnnuler: () => void
}

const TAILLE_MAX = 10 * 1024 * 1024 // 10 Mo, comme la limite du bucket

// US06a : l'étudiant choisit la zone, prend une photo et envoie sa déclaration.
// La déclaration part « en attente » : le poids et la validation viendront de la pesée (US07).
// US06b : la position GPS est jointe et vérifiée (ici pour prévenir, puis par la base).
export default function Declarer({ client, userId, onTermine, onAnnuler }: Props) {
  const [zones, setZones] = useState<Zone[]>([])
  const [zoneId, setZoneId] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [erreurGps, setErreurGps] = useState<string | null>(null)

  // Demande la position dès l'ouverture de l'écran (le navigateur demande l'autorisation la première fois).
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setErreurGps("Ce téléphone ne permet pas la géolocalisation.")
      return
    }
    const suivi = navigator.geolocation.watchPosition(
      (p) => {
        setErreurGps(null)
        setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude, precision: Math.round(p.coords.accuracy) })
      },
      (e) =>
        setErreurGps(
          e.code === e.PERMISSION_DENIED
            ? 'Localisation refusée : autorise-la dans les réglages du navigateur pour déclarer.'
            : 'Position introuvable : vérifie que la localisation est activée.',
        ),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 },
    )
    return () => navigator.geolocation.clearWatch(suivi)
  }, [])

  // Dès que la position est connue, propose la zone la plus proche.
  useEffect(() => {
    if (!position || zoneId || zones.length === 0) return
    const proche = [...zones].sort((a, b) => distanceM(position, a) - distanceM(position, b))[0]
    if (distanceM(position, proche) <= rayonM(proche)) setZoneId(String(proche.id))
  }, [position, zones, zoneId])

  useEffect(() => {
    client
      .from('zone')
      .select('id, code, nom, commune, latitude, longitude, longueur_km')
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
    if (!position) return setErreur('Position GPS en attente : active la localisation puis réessaie.')
    const zone = zones.find((z) => String(z.id) === zoneId)
    if (zone && distanceM(position, zone) > rayonM(zone)) {
      const km = (distanceM(position, zone) / 1000).toFixed(1)
      return setErreur(`Tu es à ${km} km de la zone ${zone.code} : choisis la zone où tu te trouves.`)
    }

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
      .insert({
        profil_id: userId,
        zone_id: Number(zoneId),
        photo_url: photoUrl,
        latitude: position.latitude,
        longitude: position.longitude,
      })

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

        <p className={erreurGps ? 'erreur' : 'aide'} role="status">
          {erreurGps ?? (position ? `Position GPS obtenue (précision ± ${position.precision} m)` : 'Recherche de ta position GPS…')}
        </p>

        <label>
          Photo du ramassage
          {/* capture="environment" ouvre directement l'appareil photo arrière sur téléphone */}
          <input type="file" accept="image/*" capture="environment" onChange={choisirPhoto} />
        </label>
        {apercu && <img className="apercu" src={apercu} alt="Aperçu de la photo du ramassage" />}

        {erreur && <p className="erreur" role="alert">{erreur}</p>}

        <button type="submit" className="principal" disabled={envoi || !position}>
          {envoi ? 'Envoi en cours…' : 'Envoyer ma déclaration'}
        </button>
        <button type="button" className="secondaire" onClick={onAnnuler} disabled={envoi}>
          Annuler
        </button>
      </form>
    </section>
  )
}
