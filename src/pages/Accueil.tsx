import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profil } from '../types'

type Zone = { code: string; nom: string; commune: string }

type Props = {
  client: SupabaseClient
  profil: Profil
  onModifier: () => void
}

export default function Accueil({ client, profil, onModifier }: Props) {
  const [zones, setZones] = useState<Zone[]>([])
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    client
      .from('zone')
      .select('code, nom, commune')
      .order('code')
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setZones(data ?? [])
      })
  }, [client])

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
        <button type="button" className="secondaire" onClick={onModifier}>
          Modifier mon profil
        </button>
        <button type="button" className="lien" onClick={() => client.auth.signOut()}>
          Se déconnecter
        </button>
      </section>

      <h2>Zones du littoral ({zones.length})</h2>
      {erreur && <p className="erreur">{erreur}</p>}
      <ul className="zones">
        {zones.map((z) => (
          <li key={z.code}>
            <strong>{z.code}</strong> {z.nom}
          </li>
        ))}
      </ul>
    </>
  )
}
