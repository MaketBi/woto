"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultatAction } from "@/app/actions/versements";

const MOTIFS = ["garage", "conges", "revision", "panne", "autre"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Déclare une plage de jours non dus (montant_journalier = 0) —
 * UN SEUL ajustement couvrant toute la plage.
 */
export async function creerAjustement(params: {
  contratId: string;
  dateDebut: string;
  dateFin: string;
  motif: string;
  commentaire?: string;
}): Promise<ResultatAction> {
  const { contratId, dateDebut, dateFin, motif, commentaire } = params;
  if (!DATE_RE.test(dateDebut) || !DATE_RE.test(dateFin))
    return { ok: false, erreur: "Dates invalides." };
  if (dateFin < dateDebut)
    return { ok: false, erreur: "La fin doit être après le début." };
  if (!MOTIFS.includes(motif)) return { ok: false, erreur: "Motif inconnu." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnecte-toi." };

  const { error } = await supabase.from("ajustements").insert({
    contrat_id: contratId,
    date_debut: dateDebut,
    date_fin: dateFin,
    montant_journalier: 0,
    motif,
    commentaire: commentaire?.trim() || null,
    cree_par: user.id,
  });

  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Repasse des jours en dus : suppression de l'ajustement. */
export async function supprimerAjustement(id: string): Promise<ResultatAction> {
  const supabase = await createClient();
  const { error } = await supabase.from("ajustements").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** L'ajustement couvrant un jour donné (pour « Repasser en jour dû »). */
export async function ajustementDuJour(
  contratId: string,
  jour: string
): Promise<{ id: string; motif: string; commentaire: string | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ajustements")
    .select("id, motif, commentaire")
    .eq("contrat_id", contratId)
    .lte("date_debut", jour)
    .gte("date_fin", jour)
    .order("cree_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
