import { useEffect, useRef, useState } from 'react'

// Fait défiler un nombre de son ancienne valeur vers la nouvelle (les points qui montent après une pesée).
export function useCompteur(cible: number, dureeMs = 900): number {
  const [valeur, setValeur] = useState(cible)
  const depart = useRef(cible)

  useEffect(() => {
    const debut = depart.current
    if (debut === cible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      depart.current = cible
      setValeur(cible)
      return
    }
    const t0 = performance.now()
    let image = 0
    const pas = (t: number) => {
      const p = Math.min(1, (t - t0) / dureeMs)
      const adouci = 1 - Math.pow(1 - p, 3) // ralentit en fin de course
      setValeur(Math.round(debut + (cible - debut) * adouci))
      if (p < 1) image = requestAnimationFrame(pas)
      else depart.current = cible
    }
    image = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(image)
  }, [cible, dureeMs])

  return valeur
}
