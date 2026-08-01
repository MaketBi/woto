import "server-only";
import { headers } from "next/headers";

// URL publique de l'application.
//
// Dérivée des en-têtes de la requête plutôt que codée en dur : le lien de
// partage suit ainsi le domaine réellement servi (Vercel, preview, local)
// sans qu'aucune variable ne soit à configurer. Un lien « localhost » envoyé
// au chauffeur depuis la production ne peut donc plus se produire.
//
// NEXT_PUBLIC_SITE_URL reste prioritaire quand elle est définie : elle permet
// de forcer le domaine canonique si l'app est servie derrière plusieurs noms.

function estLocal(hote: string): boolean {
  return hote.startsWith("localhost") || hote.startsWith("127.0.0.1");
}

export async function getSiteUrl(): Promise<string> {
  const enTetes = await headers();
  // x-forwarded-host est posé par le proxy Vercel ; host est le repli local.
  const hote = enTetes.get("x-forwarded-host") ?? enTetes.get("host");

  const configuree = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuree) {
    // Garde-fou : une variable « localhost » recopiée depuis .env.local sur
    // l'hébergeur produirait un lien de partage inutilisable pour le chauffeur.
    // Quand la requête vient d'un vrai domaine, la requête l'emporte.
    const configureeLocale = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(configuree);
    if (!configureeLocale || !hote || estLocal(hote)) {
      return configuree.replace(/\/+$/, "");
    }
  }

  if (!hote) return "http://localhost:3000";

  const protocole =
    enTetes.get("x-forwarded-proto") ?? (estLocal(hote) ? "http" : "https");

  return `${protocole}://${hote}`;
}
