import { useEffect, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profil } from '../types'
import { chargerMaree, heure as heureMaree, jour, type Creneau } from '../maree'
import { seChevauchent, type Sortie } from './Sorties'

type Zone = { id: number; code: string; nom: string; maree_basse?: boolean }
type Props = { client: SupabaseClient; moi: Profil; onTermine: () => void; onAnnuler: () => void }

// Valeur pour <input type="datetime-local"> (heure locale, sans fuseau).
const versChamp = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Réserver un créneau : au nom de son association ou de son école, avec les marées basses proposées.
export default function CreerSortie({ client, moi, onTermine, onAnnuler }: Props) {
  const [zones, setZones] = useState<Zone[]>([])
  const [existantes, setExistantes] = useState<Sortie[]>([])
  const [creneaux, setCreneaux] = useState<Creneau[]>([])
  // Organisations que je dirige (rôle validé) : seules celles-ci peuvent réserver un créneau.
  const [roles, setRoles] = useState<{ cle: string; type: 'association' | 'ecole'; associationId: number | null; ecole: string | null; nom: string }[]>([])
  const [organisateur, setOrganisateur] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [places, setPlaces] = useState('')
  const [rendezVous, setRendezVous] = useState('')
  const [description, setDescription] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    client.from('zone').select('*').order('code').then(({ data }) => setZones((data ?? []) as Zone[]))
    client
      .from('sortie_details')
      .select('*')
      .gte('fin', new Date().toISOString())
      .then(({ data }) => setExistantes((data ?? []) as Sortie[]))
    client
      .from('dirigeant')
      .select('association_id, ecole, association(nom)')
      .eq('profil_id', moi.id)
      .eq('statut', 'valide')
      .then(({ data }) => {
        const liste = (data ?? []).map((d) => {
          const assoc = d.association as unknown as { nom: string } | null
          return d.ecole
            ? { cle: `e:${d.ecole}`, type: 'ecole' as const, associationId: null, ecole: d.ecole as string, nom: d.ecole as string }
            : { cle: `a:${d.association_id}`, type: 'association' as const, associationId: d.association_id as number, ecole: null, nom: assoc?.nom ?? 'Association' }
        })
        setRoles(liste)
        if (liste[0]) setOrganisateur(liste[0].cle)
      })
    // Les créneaux de marée basse de jour sont proposés en un clic.
    chargerMaree()
      .then((etat) => setCreneaux((etat?.creneaux ?? []).filter((c) => c.deJour && c.debut.getTime() > Date.now())))
      .catch(() => undefined)
  }, [client, moi.id])

  function choisirCreneau(c: Creneau) {
    setDebut(versChamp(c.debut))
    setFin(versChamp(c.fin))
  }

  const zone = zones.find((z) => String(z.id) === zoneId)
  const chevauchement =
    zoneId && debut && fin
      ? existantes.find((s) =>
          seChevauchent(s, { zone_id: Number(zoneId), debut: new Date(debut).toISOString(), fin: new Date(fin).toISOString() }),
        )
      : undefined

  async function valider(e: FormEvent) {
    e.preventDefault()
    const role = roles.find((r) => r.cle === organisateur)
    if (!role) return setErreur("Tu dois être dirigeant d'une école ou d'une association pour réserver.")
    if (!zoneId) return setErreur('Choisis la zone.')
    if (!debut || !fin) return setErreur('Indique le début et la fin du créneau.')
    const d = new Date(debut)
    const f = new Date(fin)
    if (d.getTime() <= Date.now()) return setErreur('Le créneau doit être dans le futur.')
    if (f <= d) return setErreur('La fin doit être après le début.')
    if (f.getTime() - d.getTime() > 8 * 3600 * 1000) return setErreur('Une sortie dure 8 h au maximum.')
    if (rendezVous.trim().length < 3) return setErreur('Indique un point de rendez-vous.')

    setErreur(null)
    setEnvoi(true)
    const { error } = await client.from('sortie').insert({
      zone_id: Number(zoneId),
      organisateur_type: role.type,
      association_id: role.associationId,
      ecole: role.ecole,
      debut: d.toISOString(),
      fin: f.toISOString(),
      places: places ? Number(places) : null,
      rendez_vous: rendezVous.trim(),
      description: description.trim() || null,
      cree_par: moi.id,
    })
    setEnvoi(false)
    if (error) return setErreur(`Réservation impossible : ${error.message}`)
    onTermine()
  }

  return (
    <section className="carte">
      <h2>Réserver un créneau</h2>
      <p className="aide">La sortie sera ouverte à tous les bénévoles. Tu y seras inscrit automatiquement.</p>

      <form onSubmit={valider}>
        <label>
          Organisée par
          <select value={organisateur} onChange={(e) => setOrganisateur(e.target.value)}>
            {roles.map((r) => (
              <option key={r.cle} value={r.cle}>
                {r.nom} ({r.type === 'ecole' ? 'école' : 'association'})
              </option>
            ))}
          </select>
        </label>

        <label>
          Zone
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
            <option value="">Choisis la zone…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.code} · {z.nom}
              </option>
            ))}
          </select>
        </label>

        {creneaux.length > 0 && (
          <div>
            <p className="aide">
              {zone?.maree_basse === false ? 'Zone praticable à toute heure. ' : ''}Créneaux de marée basse conseillés :
            </p>
            <div className="choix-creneaux">
              {creneaux.slice(0, 4).map((c) => (
                <button key={c.basse.toISOString()} type="button" className="secondaire" onClick={() => choisirCreneau(c)}>
                  {jour(c.debut)} {heureMaree(c.debut)}–{heureMaree(c.fin)}
                </button>
              ))}
            </div>
          </div>
        )}

        <label>
          Début
          <input type="datetime-local" required value={debut} onChange={(e) => setDebut(e.target.value)} />
        </label>
        <label>
          Fin
          <input type="datetime-local" required value={fin} onChange={(e) => setFin(e.target.value)} />
        </label>

        {chevauchement && (
          <p className="info">
            ⚠️ {chevauchement.organisateur_nom} a déjà prévu une sortie sur cette zone à ce moment-là. Tu peux quand même réserver, ou
            rejoindre la sienne.
          </p>
        )}

        <label>
          Point de rendez-vous
          <input maxLength={200} required value={rendezVous} onChange={(e) => setRendezVous(e.target.value)} placeholder="Ex. parking de la plage" />
        </label>
        <label>
          Nombre de places (facultatif)
          <input type="number" inputMode="numeric" min="2" max="200" value={places} onChange={(e) => setPlaces(e.target.value)} />
        </label>
        <label>
          Infos pratiques (facultatif)
          <textarea maxLength={500} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Matériel, gants, sacs fournis…" />
        </label>

        {erreur && <p className="erreur" role="alert">{erreur}</p>}

        <button type="submit" className="principal" disabled={envoi}>
          {envoi ? 'Réservation…' : 'Réserver le créneau'}
        </button>
        <button type="button" className="secondaire" onClick={onAnnuler} disabled={envoi}>
          Annuler
        </button>
      </form>
    </section>
  )
}
