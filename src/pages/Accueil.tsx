import { useEffect } from 'react'
import { useCompteur } from '../useCompteur'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profil } from '../types'
import type { Page } from '../App'
import MesDeclarations from './MesDeclarations'
import Maree from './Maree'
import Niveau from '../components/Niveau'
import Mascotte from '../components/Mascotte'
import Trophees from '../components/Trophees'

type Props = {
  client: SupabaseClient
  profil: Profil
  onModifier: () => void
  onDeclarer: () => void
  onPeser: (declarationId: number) => void
  onPage: (page: Page) => void
  onRafraichir: () => void
}

const salutation = () => {
  const h = new Date().getHours()
  return h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bel après-midi' : 'Bonsoir'
}

export default function Accueil({ client, profil, onModifier, onDeclarer, onPeser, onPage, onRafraichir }: Props) {
  const pointsAffiches = useCompteur(profil.points)
  const kg = (profil.points / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  // Recharge le profil à chaque retour sur l'accueil : les points ont pu être crédités entre-temps.
  useEffect(() => {
    onRafraichir()
  }, [onRafraichir])

  return (
    <>
      <section className="carte profil">
        <div>
          <p className="salut">{salutation()},</p>
          <p className="pseudo">{profil.pseudo}</p>
          <p className="aide">{profil.ecole}</p>
        </div>
        <div className="compteur" key={profil.points}>
          <strong>{pointsAffiches}</strong>
          <span>pts</span>
          <small>≈ {kg} kg ramassés</small>
        </div>
        <button type="button" className="declarer" onClick={onDeclarer}>
          <span aria-hidden="true">📸</span> Déclarer un ramassage
        </button>
        <button type="button" className="secondaire" onClick={onModifier}>
          Modifier mon profil
        </button>
        <button type="button" className="lien" onClick={() => client.auth.signOut()}>
          Se déconnecter
        </button>
      </section>


      <Mascotte pseudo={profil.pseudo} />

      <Niveau points={profil.points} />

      <Maree />

      <button type="button" className="carte raccourci" onClick={() => onPage('sorties')}>
        <span className="raccourci-icone" aria-hidden="true">📅</span>
        <span>
          <strong>Ramasser en groupe</strong>
          <small>Rejoins une sortie organisée par une école ou une association</small>
        </span>
        <span aria-hidden="true">›</span>
      </button>

      <Trophees client={client} userId={profil.id} points={profil.points} />

      <h2>Mes ramassages</h2>
      <MesDeclarations client={client} userId={profil.id} onPeser={onPeser} />
    </>
  )
}
