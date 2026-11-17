import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Html5Qrcode } from 'html5-qrcode'
import Confettis from '../components/Confettis'

type Props = {
  client: SupabaseClient
  declarationId: number
  onTermine: () => void
}

const ID_LECTEUR = 'lecteur-qr'

// US07 : au point de collecte, l'étudiant scanne le QR code du référent puis saisit le poids affiché par la balance.
// La vérification (QR connu, déclaration à lui, 20 kg max) et la validation se font côté serveur (valider_pesee).
export default function Pesee({ client, declarationId, onTermine }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [poids, setPoids] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const lecteur = useRef<Html5Qrcode | null>(null)

  // Démarre la caméra arrière tant qu'aucun QR code n'est lu.
  useEffect(() => {
    if (qrCode) return
    const scanner = new Html5Qrcode(ID_LECTEUR)
    lecteur.current = scanner
    let actif = true
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (texte) => {
          if (!actif) return
          actif = false
          scanner.stop().catch(() => undefined)
          setQrCode(texte)
        },
        () => undefined, // aucune lecture sur cette image : on continue
      )
      .catch(() => setErreur("Caméra inaccessible : autorise l'accès à la caméra pour scanner le QR code."))

    return () => {
      actif = false
      if (scanner.isScanning) scanner.stop().catch(() => undefined)
    }
  }, [qrCode])

  async function valider(e: FormEvent) {
    e.preventDefault()
    const valeur = Number(poids.replace(',', '.'))
    if (!qrCode) return setErreur("Scanne d'abord le QR code du point de collecte.")
    if (!(valeur > 0)) return setErreur('Saisis le poids affiché par la balance.')
    if (valeur > 20) return setErreur('20 kg maximum par déclaration.')

    setErreur(null)
    setEnvoi(true)
    const { data, error } = await client.rpc('valider_pesee', {
      p_declaration: declarationId,
      p_qr_code: qrCode,
      p_poids: valeur,
    })
    setEnvoi(false)
    if (error) return setErreur(error.message)
    setPoints(data as number)
  }

  if (points !== null) {
    return (
      <section className="carte succes">
        <Confettis />
        <h2>Pesée validée !</h2>
        <p className="points">
          <strong>+{points}</strong> pts
        </p>
        <button type="button" className="principal" onClick={onTermine}>
          Retour à l'accueil
        </button>
      </section>
    )
  }

  return (
    <section className="carte">
      <h2>Faire peser mon ramassage</h2>

      {!qrCode ? (
        <>
          <p className="aide">1. Scanne le QR code que te montre le référent de l'association.</p>
          <div id={ID_LECTEUR} className="lecteur" />
        </>
      ) : (
        <p className="info">
          QR code du point de collecte lu ✓{' '}
          <button type="button" className="lien" onClick={() => setQrCode(null)}>
            Rescanner
          </button>
        </p>
      )}

      <form onSubmit={valider}>
        <label>
          2. Poids affiché par la balance (kg)
          <input
            type="number"
            inputMode="decimal"
            min="0.1"
            max="20"
            step="0.1"
            required
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
            disabled={!qrCode}
          />
        </label>
        <p className="aide">20 kg maximum par déclaration.</p>

        {erreur && <p className="erreur" role="alert">{erreur}</p>}

        <button type="submit" className="principal" disabled={envoi || !qrCode}>
          {envoi ? 'Validation…' : 'Valider la pesée'}
        </button>
        <button type="button" className="secondaire" onClick={onTermine} disabled={envoi}>
          Annuler
        </button>
      </form>
    </section>
  )
}
