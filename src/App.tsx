import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { COLONNES_PROFIL, type Profil } from './types'
import Connexion from './pages/Connexion'
import NouveauMotDePasse from './pages/NouveauMotDePasse'
import ProfilForm from './pages/ProfilForm'
import Accueil from './pages/Accueil'
import Declarer from './pages/Declarer'
import Classement from './pages/Classement'
import Catalogue from './pages/Catalogue'
import MesBons from './pages/MesBons'
import Sorties from './pages/Sorties'
import CreerSortie from './pages/CreerSortie'
import Vagues from './components/Vagues'
import PluieFete from './components/PluieFete'
import Jeu from './pages/Jeu'
import BarreNavigation from './components/BarreNavigation'
import Chargement from './components/Chargement'
import { DUREE_ECRAN_ACCUEIL, useDelaiMinimum } from './useDelaiMinimum'
// Le lecteur de QR code est lourd : il n'est chargé qu'au moment de la pesée.
const Pesee = lazy(() => import('./pages/Pesee'))

// Pages accessibles depuis l'accueil.
export type Page = 'accueil' | 'classement' | 'catalogue' | 'bons' | 'sorties' | 'creer-sortie' | 'jeu'

// Choisit l'écran à afficher : connexion, création du profil ou accueil.
// Convention : `undefined` = pas encore chargé, `null` = n'existe pas.
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  const [erreurProfil, setErreurProfil] = useState<string | null>(null)
  const [edition, setEdition] = useState(false)
  const [declarer, setDeclarer] = useState(false)
  const [pesee, setPesee] = useState<number | null>(null)
  const [page, setPage] = useState<Page>('accueil')
  // Écran de démarrage : le raton laveur balaie au moins DUREE_ECRAN_ACCUEIL ms.
  const demarrageFini = useDelaiMinimum(DUREE_ECRAN_ACCUEIL)
  const [vitrine, setVitrine] = useState(false) // catalogue visible sans être connecté
  const [recuperation, setRecuperation] = useState(false)
  const [felicitations, setFelicitations] = useState<string | null>(null)
  const finFelicitations = useCallback(() => setFelicitations(null), []) // pluie de déchets après une déclaration

  // Suit la session : appelé au démarrage, puis à chaque connexion ou déconnexion.
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((evenement, nouvelle) => {
      setSession(nouvelle)
      // Arrivée par le lien « mot de passe oublié » : on affiche l'écran du nouveau mot de passe (US17).
      if (evenement === 'PASSWORD_RECOVERY') setRecuperation(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Charge le profil de l'utilisateur connecté (null s'il ne l'a pas encore créé).
  const userId = session?.user.id
  const chargerProfil = useCallback(() => {
    if (!supabase || !userId) return
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

  useEffect(() => {
    setEdition(false)
    setDeclarer(false)
    setPesee(null)
    setPage('accueil')
    setErreurProfil(null)
    if (!userId) setProfil(undefined)
    else chargerProfil()
  }, [userId, chargerProfil])

  function contenu() {
    if (!supabase) {
      return <p className="erreur">Supabase non configuré : copiez .env.example en .env.local et remplissez-le.</p>
    }
    if (!demarrageFini || session === undefined) return <Chargement duree={DUREE_ECRAN_ACCUEIL} />
    if (session === null) {
      return vitrine ? (
        <Catalogue client={supabase} points={null} onRetour={() => setVitrine(false)} />
      ) : (
        <Connexion client={supabase} onVoirRecompenses={() => setVitrine(true)} />
      )
    }
    if (recuperation) return <NouveauMotDePasse client={supabase} onTermine={() => setRecuperation(false)} />
    if (erreurProfil) return <p className="erreur">Impossible de charger le profil : {erreurProfil}</p>
    if (profil === undefined) return <Chargement texte="Le raton laveur range ton profil…" />

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
    if (pesee !== null) {
      return (
        <Suspense fallback={<Chargement texte="Ouverture du lecteur de QR code…" />}>
          <Pesee client={supabase} declarationId={pesee} onTermine={() => setPesee(null)} />
        </Suspense>
      )
    }
    if (declarer) {
      return (
        <Declarer
          client={supabase}
          userId={session.user.id}
          onTermine={() => {
            setDeclarer(false)
            setFelicitations('Ramassage déclaré ! Le raton laveur danse de joie 🦝💃')
          }}
          onAnnuler={() => setDeclarer(false)}
        />
      )
    }
    if (page === 'classement') {
      return <Classement client={supabase} moi={profil} onRetour={() => setPage('accueil')} />
    }
    if (page === 'catalogue') {
      return (
        <Catalogue client={supabase} points={profil.points} onEchange={chargerProfil} onRetour={() => setPage('accueil')} />
      )
    }
    if (page === 'sorties') {
      return <Sorties client={supabase} moi={profil} onCreer={() => setPage('creer-sortie')} onRetour={() => setPage('accueil')} />
    }
    if (page === 'creer-sortie') {
      return <CreerSortie client={supabase} moi={profil} onTermine={() => setPage('sorties')} onAnnuler={() => setPage('sorties')} />
    }
    if (page === 'jeu') {
      return <Jeu onRetour={() => setPage('accueil')} />
    }
    if (page === 'bons') {
      return <MesBons client={supabase} onRetour={() => setPage('accueil')} />
    }
    return (
      <Accueil
        client={supabase}
        profil={profil}
        onModifier={() => setEdition(true)}
        onDeclarer={() => setDeclarer(true)}
        onPeser={(id) => setPesee(id)}
        onPage={setPage}
        onRafraichir={chargerProfil}
      />
    )
  }

  // La barre du bas n'apparaît que sur les pages principales (pas pendant une déclaration, une pesée ou l'édition du profil).
  const navigationVisible = Boolean(session && profil && !recuperation && !edition && !declarer && pesee === null && page !== 'creer-sortie')
  // Clé de l'écran affiché : quand elle change, l'écran rejoue son animation d'entrée.
  const ecran = recuperation ? 'recuperation' : !session ? (vitrine ? 'vitrine' : 'connexion') : edition || !profil ? 'profil' : pesee !== null ? 'pesee' : declarer ? 'declarer' : page

  return (
    <>
      <Vagues compact={Boolean(session && profil)} />
      <main className={navigationVisible ? 'avec-navigation' : ''}>
        <div key={ecran} className="ecran">
          {contenu()}
        </div>
      </main>
      {felicitations && <PluieFete texte={felicitations} onFin={finFelicitations} />}
      {navigationVisible && <BarreNavigation page={page} onPage={setPage} />}
    </>
  )
}
