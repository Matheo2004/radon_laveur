import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Zone = { code: string; nom: string; commune: string }

// Page de vérification du sprint 0 : prouve que l'app est déployée
// et qu'elle lit bien la table `zone` dans Supabase.
export default function App() {
  const [zones, setZones] = useState<Zone[]>([])
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setErreur('Supabase non configuré : copiez .env.example en .env.local et remplissez-le.')
      return
    }
    supabase
      .from('zone')
      .select('code, nom, commune')
      .order('code')
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setZones(data ?? [])
      })
  }, [])

  return (
    <main>
      <h1>Radon Laveur</h1>
      <p className="slogan">Ramassons main dans la main</p>
      <h2>Zones du littoral ({zones.length})</h2>
      {erreur && <p className="erreur">{erreur}</p>}
      <ul>
        {zones.map((z) => (
          <li key={z.code}>
            <strong>{z.code}</strong> {z.nom}
          </li>
        ))}
      </ul>
    </main>
  )
}
