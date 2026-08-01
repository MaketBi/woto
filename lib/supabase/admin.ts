import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Client service_role — contourne RLS. Réservé au serveur : OTP chauffeur
// (app/actions/otp.ts) et page publique /p/[jeton].
// `server-only` fait échouer la compilation si ce module est importé côté client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Sans ces variables, supabase-js lève « supabaseKey is required » : une
  // exception opaque qui s'affiche en « Application error » avec un digest,
  // sans indiquer la cause. On échoue explicitement à la place.
  // NE JAMAIS inclure la valeur de la clé dans le message.
  if (!url || !cle) {
    const manquantes = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !cle && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);
    throw new Error(
      `Variables d'environnement manquantes : ${manquantes.join(", ")}. ` +
        "À définir dans les réglages de l'hébergeur (voir SETUP.md)."
    );
  }

  return createSupabaseClient<Database>(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
