// Mention d'information RGPD affichée à l'inscription.
// BROUILLON à faire valider par l'équipe et par l'association (responsable du traitement, article 6 du contrat).
export const VERSION_MENTION = '2026-11-17'

export default function MentionInformation() {
  return (
    <details className="mention">
      <summary>Lire la mention d'information sur tes données</summary>
      <p>
        <strong>Qui ?</strong> Les données sont traitées pour l'association environnementale qui porte Radon Laveur
        (responsable du traitement). L'application est hébergée en Europe (Supabase, GitHub Pages).
      </p>
      <p>
        <strong>Quelles données ?</strong> Ton e-mail, ton pseudo, ton école, et pour chaque ramassage : la zone, la photo,
        ta position au moment de la déclaration, le poids pesé et la date.
      </p>
      <p>
        <strong>Pourquoi ?</strong> Prouver les ramassages, calculer tes points, afficher le classement (sous ton pseudo
        uniquement) et produire des statistiques anonymes sur la propreté du littoral.
      </p>
      <p>
        <strong>Qui voit quoi ?</strong> Tes déclarations, photos et positions ne sont visibles que par toi (et, pour
        valider une pesée, par les référents de l'association). Ton pseudo, ton école et tes points apparaissent dans le
        classement. Les métadonnées des photos (position, modèle du téléphone) sont effacées avant l'envoi.
      </p>
      <p>
        <strong>Combien de temps ?</strong> Les photos sont conservées au plus 6 mois après la pesée ; le compte, jusqu'à
        sa suppression.
      </p>
      <p>
        <strong>Tes droits :</strong> accès, rectification, suppression de tes données et de ton compte, en écrivant à
        l'association (adresse de contact à compléter). Tu peux aussi saisir la CNIL.
      </p>
    </details>
  )
}
