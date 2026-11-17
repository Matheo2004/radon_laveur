import { useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { COLONNES_PROFIL, type Profil } from '../types'

// Suggestions pour garder des noms d'école homogènes (saisie libre possible).
const ECOLES = [
  'UBO – Université de Bretagne Occidentale',
  'IMT Atlantique',
  'ENSTA',
  'ENIB',
  'ISEN Brest',
  'Brest Business School',
  'École navale',
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
  const [ecole, setEcole] = useState(initial?.ecole ?? '')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function valider(e: FormEvent) {
    e.preventDefault()
    const pseudoPropre = pseudo.trim()
    const ecolePropre = ecole.trim()

    if (!FORMAT_PSEUDO.test(pseudoPropre)) {
      setErreur('Le pseudo doit faire 3 à 20 caractères, sans espace (lettres, chiffres, . _ -).')
      return
    }

    setErreur(null)
    setEnvoi(true)

    // Seuls le pseudo et l'école sont envoyés : les points ne viennent jamais du navigateur.
    const champs = { pseudo: pseudoPropre, ecole: ecolePropre }
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
          <input
            list="liste-ecoles"
            autoComplete="organization"
            required
            value={ecole}
            onChange={(e) => setEcole(e.target.value)}
          />
          <datalist id="liste-ecoles">
            {ECOLES.map((nom) => (
              <option key={nom} value={nom} />
            ))}
          </datalist>
        </label>

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
