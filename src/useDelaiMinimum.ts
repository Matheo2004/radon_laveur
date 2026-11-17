import { useEffect, useState } from 'react'

// Durées d'affichage minimales du raton laveur balayeur (à régler ici, en millisecondes).
export const DUREE_ECRAN_ACCUEIL = 3200 // au démarrage de l'application
export const DUREE_MIN_CHARGEMENT = 1500 // à l'ouverture de chaque page

// Renvoie false pendant `ms` millisecondes après l'apparition du composant, puis true.
// Sert à laisser le raton laveur finir son coup de balai, même quand les données arrivent très vite.
export function useDelaiMinimum(ms: number = DUREE_MIN_CHARGEMENT): boolean {
  const [fini, setFini] = useState(false)
  useEffect(() => {
    const minuteur = window.setTimeout(() => setFini(true), ms)
    return () => window.clearTimeout(minuteur)
  }, [ms])
  return fini
}
