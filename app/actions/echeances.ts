"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultatAction } from "@/app/actions/versements";

const TYPES = ["assurance", "controle_technique", "vidange", "autre"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function valider(params: {
  type: string;
  libelle: string;
  dateEcheance?: string;
  montant?: number;
  rappelJours?: number;
}): string | null {
  if (!TYPES.includes(params.type)) return "Type inconnu.";
  if (!params.libelle.trim()) return "Le libellé est obligatoire.";
  if (params.dateEcheance && !DATE_RE.test(params.dateEcheance))
    return "Date invalide.";
  if (
    params.montant !== undefined &&
    (!Number.isInteger(params.montant) || params.montant < 0)
  )
    return "Montant invalide.";
  if (
    params.rappelJours !== undefined &&
    (!Number.isInteger(params.rappelJours) || params.rappelJours < 0)
  )
    return "Rappel invalide.";
  return null;
}

export async function creerEcheance(params: {
  vehiculeId: string;
  type: string;
  libelle: string;
  dateEcheance?: string;
  montant?: number;
  rappelJours?: number;
}): Promise<ResultatAction> {
  const erreur = valider(params);
  if (erreur) return { ok: false, erreur };

  const supabase = await createClient();
  const { error } = await supabase.from("echeances").insert({
    vehicule_id: params.vehiculeId,
    type: params.type,
    libelle: params.libelle.trim(),
    date_echeance: params.dateEcheance || null,
    montant: params.montant ?? null,
    rappel_jours: params.rappelJours ?? 15,
  });

  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessaie." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function modifierEcheance(params: {
  id: string;
  type: string;
  libelle: string;
  dateEcheance?: string;
  montant?: number;
  rappelJours?: number;
}): Promise<ResultatAction> {
  const erreur = valider(params);
  if (erreur) return { ok: false, erreur };

  const supabase = await createClient();
  const { error } = await supabase
    .from("echeances")
    .update({
      type: params.type,
      libelle: params.libelle.trim(),
      date_echeance: params.dateEcheance || null,
      montant: params.montant ?? null,
      rappel_jours: params.rappelJours ?? 15,
    })
    .eq("id", params.id);

  if (error) return { ok: false, erreur: "Modification impossible. Réessaie." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Bascule le statut : à venir ↔ fait. */
export async function changerStatutEcheance(
  id: string,
  statut: "a_venir" | "fait"
): Promise<ResultatAction> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("echeances")
    .update({ statut })
    .eq("id", id);
  if (error) return { ok: false, erreur: "Modification impossible. Réessaie." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function supprimerEcheance(id: string): Promise<ResultatAction> {
  const supabase = await createClient();
  const { error } = await supabase.from("echeances").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression impossible. Réessaie." };
  revalidatePath("/", "layout");
  return { ok: true };
}
