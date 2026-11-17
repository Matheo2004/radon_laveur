import type { SupabaseClient } from '@supabase/supabase-js'

const COTE_MAX = 1600 // pixels sur le plus grand côté : assez pour prouver un ramassage
const QUALITE = 0.8

// RGPD : une photo de téléphone contient des métadonnées (EXIF) : position GPS exacte, date, modèle du téléphone.
// En redessinant l'image dans un canvas, on ne garde que les pixels : les métadonnées disparaissent.
// Au passage, la photo est réduite et compressée en JPEG (~300 Ko au lieu de plusieurs Mo).
export async function nettoyerPhoto(fichier: File): Promise<Blob> {
  let image: ImageBitmap
  try {
    // imageOrientation : applique la rotation indiquée par l'EXIF avant de la supprimer.
    image = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
  } catch {
    throw new Error("Format de photo non pris en charge par ce navigateur : réessaie en JPEG ou PNG.")
  }

  const echelle = Math.min(1, COTE_MAX / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * echelle)
  canvas.height = Math.round(image.height * echelle)
  const contexte = canvas.getContext('2d')
  if (!contexte) throw new Error('Préparation de la photo impossible.')
  contexte.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Préparation de la photo impossible.'))), 'image/jpeg', QUALITE),
  )
}

// Le bucket « photos » est privé : la base ne stocke que le chemin (ex. « <id>/<uuid>.jpg »).
// Les anciennes déclarations contiennent encore une adresse publique complète : on en extrait le chemin.
export function cheminPhoto(valeur: string): string {
  const repere = '/object/public/photos/'
  const position = valeur.indexOf(repere)
  return position >= 0 ? valeur.slice(position + repere.length) : valeur
}

// Liens temporaires (1 h) pour afficher des photos privées ; seul leur auteur y a droit (règle de stockage).
export async function liensTemporaires(client: SupabaseClient, chemins: string[]): Promise<Record<string, string>> {
  if (chemins.length === 0) return {}
  const { data, error } = await client.storage.from('photos').createSignedUrls(chemins, 3600)
  if (error || !data) return {}
  const liens: Record<string, string> = {}
  for (const lien of data) if (lien.path && lien.signedUrl) liens[lien.path] = lien.signedUrl
  return liens
}
