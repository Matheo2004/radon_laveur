import { useEffect, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { COLONNES_PROFIL, type Profil } from '../types'

// Liste fixe (décision du PO) : un seul nom par école, pour que le classement par école soit juste.
// Elle doit rester identique à la contrainte profil_ecole_liste en base (migration 009).
export const ECOLES = [
  'UBO – Université de Bretagne Occidentale',
  'IMT Atlantique',
  'ENSTA',
  'ENIB',
  'ISEN Brest',
  'Brest Business School',
  'École navale',
  'Autre',
]

// Lettres (accents compris), chiffres, tiret, point et tiret bas ; 3 à 20 caractères.
const FORMAT_PSEUDO = /^[\p{L}\p{N}._-]{3,20}$/u

type Props = {
  client: SupabaseClient
  userId: string
  initial: Profil | null // null : premier passage, le profil n'existe pas encore
  onEnregistre: (profil: Profil) => void
  onAnnuler?: () => void
}

export default function ProfilForm({ client, userId, initial, onEnregistre, onAnnuler }: Props) {
  const [pseudo, setPseudo] = useState(initial?.pseudo ?? '')
  // Une ancienne saisie libre qui n'est pas dans la liste est remise à zéro : l'étudiant choisit à nouveau.
  const [ecole, setEcole] = useState(initial?.ecole && ECOLES.includes(initial.ecole) ? initial.ecole : '')
  const [associationId, setAssociationId] = useState(initial?.association_id ? String(initial.association_id) : '')
  const [associations, setAssociations] = useState<{ id: number; nom: string }[]>([])
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    client
      .from('association')
      .select('id, nom')
      .order('nom')
      .then(({ data }) => setAssociations(data ?? []))
  }, [client])
  const [erreur, setErreur] = useState<string | null>(null)

  async function valider(e: FormEvent) {
    e.preventDefault()
    const pseudoPropre = pseudo.trim()
    const ecolePropre = ecole.trim()
    if (!ECOLES.includes(ecolePropre)) return setErreur('Choisis ton école dans la liste.')

    if (!FORMAT_PSEUDO.test(pseudoPropre)) {
      setErreur('Le pseudo doit faire 3 à 20 caractères, sans espace (lettres, chiffres, . _ -).')
      return
    }

    setErreur(null)
    setEnvoi(true)

    // Seuls le pseudo et l'école sont envoyés : les points ne viennent jamais du navigateur.
    const champs = { pseudo: pseudoPropre, ecole: ecolePropre, association_id: associationId ? Number(associationId) : null }
    const requete = initial
      ? client.from('profil').update(champs).eq('id', userId)
      : client.from('profil').insert({ id: userId, ...champs })
    const { data, error } = await requete.select(COLONNES_PROFIL).single<Profil>()

    setEnvoi(false)
    if (error) {
      // 23505 = violation de la contrainte unique sur profil.pseudo
      setErreur(error.code === '23505' ? 'Ce pseudo est déjà pris, choisis-en un autre.' : `Erreur : ${error.message}`)
    } else {
      onEnregistre(data)
    }
  }

  return (
    <section className="carte">
      <h2>{initial ? 'Modifier mon profil' : 'Crée ton profil'}</h2>
      {!initial && <p className="aide">Ton pseudo apparaîtra dans le classement.</p>}

      <form onSubmit={valider}>
        <label>
          Pseudo
          <input
            autoComplete="nickname"
            autoCapitalize="none"
            maxLength={20}
            required
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
        </label>
        <label>
          École
          <select required value={ecole} onChange={(e) => setEcole(e.target.value)}>
            <option value="">Choisis ton école…</option>
            {ECOLES.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Association (facultatif)
          <select value={associationId} onChange={(e) => setAssociationId(e.target.value)}>
            <option value="">Aucune</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </label>
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
