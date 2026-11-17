import type { Page } from '../App'

const ONGLETS: { page: Page; icone: string; libelle: string }[] = [
  { page: 'accueil', icone: '🏠', libelle: 'Accueil' },
  { page: 'sorties', icone: '📅', libelle: 'Sorties' },
  { page: 'classement', icone: '🏆', libelle: 'Classement' },
  { page: 'catalogue', icone: '🎁', libelle: 'Bons' },
  { page: 'bons', icone: '🎟️', libelle: 'Mes bons' },
]

// Barre de navigation fixée en bas de l'écran, à portée de pouce sur la plage.
export default function BarreNavigation({ page, onPage }: { page: Page; onPage: (page: Page) => void }) {
  return (
    <nav className="barre-navigation" aria-label="Navigation principale">
      {ONGLETS.map((o) => (
        <button
          key={o.page}
          type="button"
          className={page === o.page ? 'actif' : ''}
          aria-current={page === o.page ? 'page' : undefined}
          onClick={() => onPage(o.page)}
        >
          <span className="icone" aria-hidden="true">
            {o.icone}
          </span>
          <span>{o.libelle}</span>
        </button>
      ))}
    </nav>
  )
}
