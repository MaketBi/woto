"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultatAction } from "@/app/actions/versements";
import type { TablesUpdate } from "@/lib/database.types";

// Gestion du lien de consultation — admin uniquement (RLS).
// Le jeton est généré par la base (12 caractères aléatoires, base64url).

export async function creerPartage(vehiculeId: string): Promise<ResultatAction> {
  const supabase = await createClient();
  const { error } = await supabase.from("partages").insert({
    vehicule_id: vehiculeId,
    libelle: "Lien de consultation",
  });
  if (error) return { ok: false, erreur: "Création impossible. Réessaie." };
  revalidatePath("/reglages");
  return { ok: true };
}

export async function majPartage(params: {
  id: string;
  actif?: boolean;
  voirMontants?: boolean;
  voirDepenses?: boolean;
}): Promise<ResultatAction> {
  const { id, actif, voirMontants, voirDepenses } = params;
  const maj: TablesUpdate<"partages"> = {};
  if (actif !== undefined) maj.actif = actif;
  if (voirMontants !== undefined) maj.voir_montants = voirMontants;
  if (voirDepenses !== undefined) maj.voir_depenses = voirDepenses;
  if (Object.keys(maj).length === 0) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase.from("partages").update(maj).eq("id", id);
  if (error) return { ok: false, erreur: "Modification impossible. Réessaie." };
  revalidatePath("/reglages");
  return { ok: true };
}

/** Invalide l'ancien lien et en génère un nouveau (nouveau jeton). */
export async function regenererPartage(id: string): Promise<ResultatAction> {
  const supabase = await createClient();

  const { data: ancien } = await supabase
    .from("partages")
    .select("vehicule_id, voir_montants, voir_depenses")
    .eq("id", id)
    .maybeSingle();
  if (!ancien) return { ok: false, erreur: "Lien introuvable." };

  const { error: erreurSuppression } = await supabase
    .from("partages")
    .delete()
    .eq("id", id);
  if (erreurSuppression)
    return { ok: false, erreur: "Régénération impossible. Réessaie." };

  const { error: erreurCreation } = await supabase.from("partages").insert({
    vehicule_id: ancien.vehicule_id,
    libelle: "Lien de consultation",
    voir_montants: ancien.voir_montants,
    voir_depenses: ancien.voir_depenses,
  });
  if (erreurCreation)
    return { ok: false, erreur: "Régénération impossible. Réessaie." };

  revalidatePath("/reglages");
  return { ok: true };
}
