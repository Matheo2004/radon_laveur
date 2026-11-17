import { useState, type FormEvent } from 'react'
import type { AuthError, SupabaseClient } from '@supabase/supabase-js'
import MentionInformation, { VERSION_MENTION } from './MentionInformation'

type Mode = 'connexion' | 'inscription'

// Traduit les erreurs de Supabase Auth en messages compréhensibles.
function messageErreur(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou mot de passe incorrect.'
    case 'email_not_confirmed':
      return "Ton adresse e-mail n'est pas encore confirmée : clique sur le lien reçu par e-mail."
    case 'user_already_exists':
      return 'Un compte existe déjà avec cet e-mail : connecte-toi.'
    case 'weak_password':
      return 'Mot de passe trop faible : 6 caractères minimum.'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Adresse e-mail invalide.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Trop de tentatives, réessaie dans quelques minutes.'
    default:
      return `Erreur : ${error.message}`
  }
}

export default function Connexion({ client, onVoirRecompenses }: { client: SupabaseClient; onVoirRecompenses: () => void }) {
  const [mode, setMode] = useState<Mode>('connexion')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [accepte, setAccepte] = useState(false)

  function changerMode(nouveau: Mode) {
    setMode(nouveau)
    setErreur(null)
    setInfo(null)
  }

  async function valider(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    setInfo(null)
    if (mode === 'inscription' && !accepte) return setErreur("Lis et accepte la mention d'information pour créer ton compte.")
    setEnvoi(true)

    if (mode === 'connexion') {
      // En cas de succès, App reçoit la nouvelle session et change d'écran.
      const { error } = await client.auth.signInWithPassword({ email, password: motDePasse })
      if (error) setErreur(messageErreur(error))
    } else {
      const { data, error } = await client.auth.signUp({
        email,
        password: motDePasse,
        // Le lien de confirmation ramène sur l'app (localhost ou GitHub Pages, sous /radon_laveur/).
        options: {
          emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
          // Trace de l'information RGPD : date et version de la mention acceptée, rangées avec le compte.
          data: { mention_acceptee_le: new Date().toISOString(), mention_version: VERSION_MENTION },
        },
      })
      if (error) setErreur(messageErreur(error))
      // Sans session, Supabase attend la confirmation de l'adresse e-mail.
      else if (!data.session) {
        setInfo('Compte créé ! Clique sur le lien reçu par e-mail pour l’activer, puis connecte-toi.')
        setMode('connexion')
      }
    }
    setEnvoi(false)
  }

  return (
    <section className="carte">
      <div className="onglets" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'connexion'}
          className={mode === 'connexion' ? 'actif' : ''}
          onClick={() => changerMode('connexion')}
        >
          Connexion
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'inscription'}
          className={mode === 'inscription' ? 'actif' : ''}
          onClick={() => changerMode('inscription')}
        >
          Inscription
        </button>
      </div>

      <form onSubmit={valider}>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
            minLength={6}
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </label>
        {mode === 'inscription' && (
          <>
            <p className="aide">6 caractères minimum.</p>
            <MentionInformation />
            <label className="case">
              <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} />
              J'ai lu la mention d'information sur mes données.
            </label>
          </>
        )}

        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        {info && <p className="info" role="status">{info}</p>}

        <button type="submit" className="principal" disabled={envoi}>
          {envoi ? 'Patiente…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>
      <button type="button" className="lien" onClick={onVoirRecompenses}>
        🎁 Voir les récompenses à gagner
      </button>
    </section>
  )
}
