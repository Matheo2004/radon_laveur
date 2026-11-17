import { useEffect, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { COLONNES_PROFIL, type Profil } from '../types'

// Lettres (accents compris), chiffres, tiret, point et tiret bas ; 3 à 20 caractères.
const FORMAT_PSEUDO = /^[\p{L}\p{N}._-]{3,20}$/u
const NOUVELLE = '__nouvelle__' // valeur de l'option « Ajouter… » dans les listes

type Association = { id: number; nom: string }
type Dirigeant = { association_id: number | null; ecole: string | null; statut: 'en_attente' | 'valide' | 'refuse' }

type Props = {
  client: SupabaseClient
  userId: string
  initial: Profil | null // null : premier passage, le profil n'existe pas encore
  onEnregistre: (profil: Profil) => void
  onAnnuler?: () => void
}

const LIBELLE_STATUT = { valide: 'Tu es dirigeant ✓', en_attente: 'Demande de dirigeant en attente de validation', refuse: 'Demande de dirigeant refusée' }

// Profil : pseudo, école et association. Si l'école ou l'association manque, on l'ajoute (et on en devient dirigeant) ;
// sinon on peut demander à en être dirigeant, demande validée par un administrateur. Seuls les dirigeants créent des sorties.
export default function ProfilForm({ client, userId, initial, onEnregistre, onAnnuler }: Props) {
  const [pseudo, setPseudo] = useState(initial?.pseudo ?? '')
  const [ecole, setEcole] = useState(initial?.ecole ?? '')
  const [nouvelleEcole, setNouvelleEcole] = useState('')
  const [associationId, setAssociationId] = useState(initial?.association_id ? String(initial.association_id) : '')
  const [nouvelleAssociation, setNouvelleAssociation] = useState('')
  const [ecoles, setEcoles] = useState<string[]>([])
  const [associations, setAssociations] = useState<Association[]>([])
  const [dirigeants, setDirigeants] = useState<Dirigeant[]>([])
  const [demandeEcole, setDemandeEcole] = useState(false)
  const [demandeAssociation, setDemandeAssociation] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    client.from('ecole').select('nom').order('nom').then(({ data }) => setEcoles((data ?? []).map((e) => e.nom as string)))
    client.from('association').select('id, nom').order('nom').then(({ data }) => setAssociations((data ?? []) as Association[]))
    if (initial) {
      client
        .from('dirigeant')
        .select('association_id, ecole, statut')
        .eq('profil_id', userId)
        .then(({ data }) => setDirigeants((data ?? []) as Dirigeant[]))
    }
  }, [client, initial, userId])

  const statutEcole = dirigeants.find((d) => d.ecole && d.ecole === ecole)?.statut
  const statutAssociation = dirigeants.find((d) => d.association_id && String(d.association_id) === associationId)?.statut

  async function valider(e: FormEvent) {
    e.preventDefault()
    const pseudoPropre = pseudo.trim()
    if (!FORMAT_PSEUDO.test(pseudoPropre)) {
      return setErreur('Le pseudo doit faire 3 à 20 caractères, sans espace (lettres, chiffres, . _ -).')
    }
    if (!ecole) return setErreur('Choisis ton école, ou ajoute-la.')
    if (ecole === NOUVELLE && nouvelleEcole.trim().length < 2) return setErreur("Indique le nom de l'école à ajouter.")
    if (associationId === NOUVELLE && nouvelleAssociation.trim().length < 2) return setErreur("Indique le nom de l'association à ajouter.")

    setErreur(null)
    setEnvoi(true)
    try {
      // 1. Profil : pseudo, et l'école ou l'association existantes (une nouvelle sera rattachée à l'étape 3).
      const champs = {
        pseudo: pseudoPropre,
        ecole: ecole === NOUVELLE ? null : ecole,
        association_id: associationId && associationId !== NOUVELLE ? Number(associationId) : null,
      }
      const enregistrement = initial
        ? await client.from('profil').update(champs).eq('id', userId).select(COLONNES_PROFIL).single<Profil>()
        : await client.from('profil').insert({ id: userId, ...champs }).select(COLONNES_PROFIL).single<Profil>()
      if (enregistrement.error) {
        throw new Error(enregistrement.error.code === '23505' ? 'Ce pseudo est déjà pris, choisis-en un autre.' : enregistrement.error.message)
      }
      let profil = enregistrement.data

      // 2. Ajout d'une école ou d'une association manquante : la base fait de son créateur un dirigeant.
      const misesAJour: { ecole?: string; association_id?: number } = {}
      if (ecole === NOUVELLE) {
        const { data, error } = await client.from('ecole').insert({ nom: nouvelleEcole.trim(), cree_par: userId }).select('nom').single()
        if (error) throw new Error(error.code === '23505' ? 'Cette école existe déjà : choisis-la dans la liste.' : error.message)
        misesAJour.ecole = data.nom as string
      }
      if (associationId === NOUVELLE) {
        const { data, error } = await client
          .from('association')
          .insert({ nom: nouvelleAssociation.trim(), cree_par: userId })
          .select('id')
          .single()
        if (error) throw new Error(error.code === '23505' ? 'Cette association existe déjà : choisis-la dans la liste.' : error.message)
        misesAJour.association_id = data.id as number
      }

      // 3. Rattachement du profil à la nouvelle école ou association.
      if (Object.keys(misesAJour).length > 0) {
        const { data, error } = await client.from('profil').update(misesAJour).eq('id', userId).select(COLONNES_PROFIL).single<Profil>()
        if (error) throw new Error(error.message)
        profil = data
      }

      // 4. Demandes de dirigeant pour une école ou une association existantes (validées par un administrateur).
      const demandes = []
      if (demandeEcole && ecole !== NOUVELLE) demandes.push({ profil_id: userId, ecole })
      if (demandeAssociation && associationId && associationId !== NOUVELLE) demandes.push({ profil_id: userId, association_id: Number(associationId) })
      if (demandes.length > 0) {
        const { error } = await client.from('dirigeant').insert(demandes)
        if (error && error.code !== '23505') throw new Error(error.message)
      }

      onEnregistre(profil)
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <section className="carte">
      <h2>{initial ? 'Modifier mon profil' : 'Crée ton profil'}</h2>
      {!initial && <p className="aide">Ton pseudo apparaîtra dans le classement.</p>}

      <form onSubmit={valider}>
        <label>
          Pseudo
          <input autoComplete="nickname" autoCapitalize="none" maxLength={20} required value={pseudo} onChange={(e) => setPseudo(e.target.value)} />
        </label>

        <label>
          École
          <select required value={ecole} onChange={(e) => setEcole(e.target.value)}>
            <option value="">Choisis ton école…</option>
            {ecoles.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
            <option value={NOUVELLE}>+ Mon école n'est pas dans la liste</option>
          </select>
        </label>
        {ecole === NOUVELLE && (
          <label>
            Nom de l'école à ajouter
            <input maxLength={80} value={nouvelleEcole} onChange={(e) => setNouvelleEcole(e.target.value)} placeholder="Ex. Lycée de l'Harteloire" />
            <span className="aide">Tu en deviendras dirigeant : tu pourras organiser des sorties en son nom.</span>
          </label>
        )}
        {ecole && ecole !== NOUVELLE && (statutEcole ? (
          <p className="aide">{LIBELLE_STATUT[statutEcole]}</p>
        ) : (
          <label className="case">
            <input type="checkbox" checked={demandeEcole} onChange={(e) => setDemandeEcole(e.target.checked)} />
            Je suis dirigeant de cette école (demande à valider)
          </label>
        ))}

        <label>
          Association (facultatif)
          <select value={associationId} onChange={(e) => setAssociationId(e.target.value)}>
            <option value="">Aucune</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
            <option value={NOUVELLE}>+ Mon association n'est pas dans la liste</option>
          </select>
        </label>
        {associationId === NOUVELLE && (
          <label>
            Nom de l'association à ajouter
            <input maxLength={80} value={nouvelleAssociation} onChange={(e) => setNouvelleAssociation(e.target.value)} />
            <span className="aide">Tu en deviendras dirigeant.</span>
          </label>
        )}
        {associationId && associationId !== NOUVELLE && (statutAssociation ? (
          <p className="aide">{LIBELLE_STATUT[statutAssociation]}</p>
        ) : (
          <label className="case">
            <input type="checkbox" checked={demandeAssociation} onChange={(e) => setDemandeAssociation(e.target.checked)} />
            Je suis dirigeant de cette association (demande à valider)
          </label>
        ))}

        <p className="aide">Tes points comptent aussi pour le classement de ton école et de ton association.</p>

        {erreur && <p className="erreur" role="alert">{erreur}</p>}

        <button type="submit" className="principal" disabled={envoi}>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {onAnnuler && (
          <button type="button" className="secondaire" onClick={onAnnuler}>
            Annuler
          </button>
        )}
      </form>
    </section>
  )
}
