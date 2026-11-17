import { useEffect } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profil } from '../types'
import type { Page } from '../App'
import MesDeclarations from './MesDeclarations'
import Maree from './Maree'

type Props = {
  client: SupabaseClient
  profil: Profil
  onModifier: () => void
  onDeclarer: () => void
  onPeser: (declarationId: number) => void
  onPage: (page: Page) => void
  onRafraichir: () => void
}

export default function Accueil({ client, profil, onModifier, onDeclarer, onPeser, onPage, onRafraichir }: Props) {
  // Recharge le profil à chaque retour sur l'accueil : les points ont pu être crédités entre-temps.
  useEffect(() => {
    onRafraichir()
  }, [onRafraichir])

  return (
    <>
      <section className="carte profil">
        <div>
          <p className="pseudo">{profil.pseudo}</p>
          <p className="aide">{profil.ecole}</p>
        </div>
        <p className="points">
          <strong>{profil.points}</strong> pts
        </p>
        <button type="button" className="declarer" onClick={onDeclarer}>
          Déclarer un ramassage
        </button>
        <button type="button" className="secondaire" onClick={onModifier}>
          Modifier mon profil
        </button>
        <button type="button" className="lien" onClick={() => client.auth.signOut()}>
          Se déconnecter
        </button>
      </section>

      <nav className="navigation">
        <button type="button" className="secondaire" onClick={() => onPage('classement')}>
          🏆 Classement
        </button>
        <button type="button" className="secondaire" onClick={() => onPage('catalogue')}>
          🎁 Bons d'achat
        </button>
        <button type="button" className="secondaire" onClick={() => onPage('bons')}>
          🎟️ Mes bons
        </button>
      </nav>

      <Maree />

      <h2>Mes ramassages</h2>
      <MesDeclarations client={client} userId={profil.id} onPeser={onPeser} />
    </>
  )
}
