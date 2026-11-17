import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Decl = { created_at: string; statut: string; poids_kg: number | null }
type Trophee = { emoji: string; nom: string; indice: string; obtenu: boolean }

// Trophées à débloquer, calculés à partir de ses propres déclarations (simple affichage, aucun point en jeu).
export default function Trophees({ client, userId, points }: { client: SupabaseClient; userId: string; points: number }) {
  const [decls, setDecls] = useState<Decl[] | null>(null)
  const [ouvert, setOuvert] = useState<string | null>(null)

  useEffect(() => {
    client
      .from('declaration')
      .select('created_at, statut, poids_kg')
      .eq('profil_id', userId)
      .then(({ data }) => setDecls((data ?? []) as Decl[]))
  }, [client, userId])

  if (!decls) return null
  const validees = decls.filter((d) => d.statut === 'validee')
  const heure = (d: Decl) => new Date(d.created_at).getHours()
  const jour = (d: Decl) => new Date(d.created_at).getDay()

  const trophees: Trophee[] = [
    { emoji: '🧹', nom: 'Premier coup de balai', indice: 'Déclare ton tout premier ramassage', obtenu: decls.length >= 1 },
    { emoji: '⚖️', nom: 'Pesé et approuvé', indice: 'Fais valider une pesée', obtenu: validees.length >= 1 },
    { emoji: '💪', nom: 'Bras de crabe', indice: 'Ramasse 5 kg en une seule fois', obtenu: validees.some((d) => (d.poids_kg ?? 0) >= 5) },
    { emoji: '🌅', nom: 'Lève-tôt des plages', indice: 'Déclare un ramassage avant 9 h', obtenu: decls.some((d) => heure(d) < 9) },
    { emoji: '🌙', nom: 'Hibou du littoral', indice: 'Déclare un ramassage après 20 h', obtenu: decls.some((d) => heure(d) >= 20) },
    { emoji: '🏖️', nom: 'Week-end utile', indice: 'Ramasse un samedi ou un dimanche', obtenu: decls.some((d) => [0, 6].includes(jour(d))) },
    { emoji: '🔁', nom: 'Habitué de la rade', indice: 'Fais 5 déclarations', obtenu: decls.length >= 5 },
    { emoji: '💯', nom: 'Centurion', indice: 'Atteins 100 points', obtenu: points >= 100 },
  ]
  const obtenus = trophees.filter((t) => t.obtenu).length
  const choisi = trophees.find((t) => t.nom === ouvert)

  return (
    <section className="carte trophees">
      <h2>
        🏆 Mes trophées{' '}
        <small>
          {obtenus} / {trophees.length}
        </small>
      </h2>
      <div className="trophees-grille">
        {trophees.map((t, i) => (
          <button
            key={t.nom}
            type="button"
            className={`trophee ${t.obtenu ? 'obtenu' : 'verrouille'} ${ouvert === t.nom ? 'choisi' : ''}`}
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => setOuvert(ouvert === t.nom ? null : t.nom)}
            aria-label={t.obtenu ? t.nom : `Trophée verrouillé : ${t.indice}`}
          >
            <span aria-hidden="true">{t.obtenu ? t.emoji : '❓'}</span>
          </button>
        ))}
      </div>
      {choisi && (
        <p className="info">
          {choisi.obtenu ? `${choisi.emoji} ${choisi.nom} : bravo !` : `🔒 Pour le débloquer : ${choisi.indice.toLowerCase()}.`}
        </p>
      )}
    </section>
  )
}
