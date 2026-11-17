import { useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// US17 : après le lien « mot de passe oublié » reçu par e-mail, Supabase ouvre une session temporaire
// de récupération ; l'étudiant choisit ici son nouveau mot de passe.
export default function NouveauMotDePasse({ client, onTermine }: { client: SupabaseClient; onTermine: () => void }) {
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [fait, setFait] = useState(false)

  async function valider(e: FormEvent) {
    e.preventDefault()
    if (motDePasse.length < 6) return setErreur('6 caractères minimum.')
    if (motDePasse !== confirmation) return setErreur('Les deux mots de passe ne sont pas identiques.')
    setErreur(null)
    setEnvoi(true)
    const { error } = await client.auth.updateUser({ password: motDePasse })
    setEnvoi(false)
    if (error) {
      return setErreur(
        error.code === 'same_password'
          ? "Choisis un mot de passe différent de l'ancien."
          : error.code === 'weak_password'
            ? 'Mot de passe trop faible : 6 caractères minimum.'
            : `Erreur : ${error.message}`,
      )
    }
    setFait(true)
  }

  if (fait) {
    return (
      <section className="carte succes">
        <h2>Mot de passe changé ✓</h2>
        <p className="aide">Tu es connecté avec ton nouveau mot de passe.</p>
        <button type="button" className="principal" onClick={onTermine}>
          Continuer
        </button>
      </section>
    )
  }

  return (
    <section className="carte">
      <h2>Nouveau mot de passe</h2>
      <form onSubmit={valider}>
        <label>
          Nouveau mot de passe
          <input type="password" autoComplete="new-password" minLength={6} required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </label>
        <label>
          Confirme-le
          <input type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </label>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button type="submit" className="principal" disabled={envoi}>
          {envoi ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}
        </button>
      </form>
    </section>
  )
}
