import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { COLONNES_PROFIL, type Profil } from './types'
import Connexion from './pages/Connexion'
import ProfilForm from './pages/ProfilForm'
import Accueil from './pages/Accueil'

// Choisit l'écran à afficher : connexion, création du profil ou accueil.
// Convention : `undefined` = pas encore chargé, `null` = n'existe pas.
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  const [erreurProfil, setErreurProfil] = useState<string | null>(null)
  const [edition, setEdition] = useState(false)

  // Suit la session : appelé au démarrage, puis à chaque connexion ou déconnexion.
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_evenement, nouvelle) => setSession(nouvelle))
    return () => data.subscription.unsubscribe()
  }, [])

  // Charge le profil de l'utilisateur connecté (null s'il ne l'a pas encore créé).
  const userId = session?.user.id
  useEffect(() => {
    setEdition(false)
    setErreurProfil(null)
    if (!supabase || !userId) {
      setProfil(undefined)
      return
    }
    supabase
      .from('profil')
      .select(COLONNES_PROFIL)
      .eq('id', userId)
      .maybeSingle<Profil>()
      .then(({ data, error }) => {
        if (error) setErreurProfil(error.message)
        else setProfil(data)
      })
  }, [userId])

  function contenu() {
    if (!supabase) {
      return <p className="erreur">Supabase non configuré : copiez .env.example en .env.local et remplissez-le.</p>
    }
    if (session === undefined) return <p className="aide">Chargement…</p>
    if (session === null) return <Connexion client={supabase} />
    if (erreurProfil) return <p className="erreur">Impossible de charger le profil : {erreurProfil}</p>
    if (profil === undefined) return <p className="aide">Chargement du profil…</p>

    if (profil === null || edition) {
      return (
        <ProfilForm
          client={supabase}
          userId={session.user.id}
          initial={profil}
          onEnregistre={(p) => {
            setProfil(p)
            setEdition(false)
          }}
          onAnnuler={profil ? () => setEdition(false) : undefined}
        />
      )
    }
    return <Accueil client={supabase} profil={profil} onModifier={() => setEdition(true)} />
  }

  return (
    <main>
      <h1>Radon Laveur</h1>
      <p className="slogan">Ramassons main dans la main</p>
      {contenu()}
    </main>
  )
}
