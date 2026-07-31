"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MODES = ["especes", "wave", "orange_money", "virement", "autre"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ResultatAction = {
  ok: boolean;
  erreur?: string;
  avertissement?: string;
};

function valider(date: string, montant: number, mode: string): string | null {
  if (!DATE_RE.test(date)) return "Date invalide.";
  if (!Number.isInteger(montant) || montant <= 0)
    return "Le montant doit être un entier positif.";
  if (!MODES.includes(mode)) return "Mode de paiement inconnu.";
  return null;
}

export async function creerVersement(params: {
  contratId: string;
  date: string;
  montant: number;
  mode: string;
  note?: string;
}): Promise<ResultatAction> {
  const { contratId, date, montant, mode, note } = params;
  const erreur = valider(date, montant, mode);
  if (erreur) return { ok: false, erreur };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnecte-toi." };

  // Avertissement non bloquant si un versement existe déjà ce jour (specs §3).
  const { count } = await supabase
    .from("versements")
    .select("id", { count: "exact", head: true })
    .eq("contrat_id", contratId)
    .eq("date", date);

  const { error } = await supabase.from("versements").insert({
    contrat_id: contratId,
    date,
    montant,
    mode,
    note: note?.trim() || null,
    saisi_par: user.id,
  });

  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessaie." };

  revalidatePath("/", "layout");
  return {
    ok: true,
    avertissement:
      count && count > 0
        ? "Un versement existait déjà pour ce jour : les deux sont conservés."
        : undefined,
  };
}

export async function modifierVersement(params: {
  id: string;
  date: string;
  montant: number;
  mode: string;
  note?: string;
}): Promise<ResultatAction> {
  const { id, date, montant, mode, note } = params;
  const erreur = valider(date, montant, mode);
  if (erreur) return { ok: false, erreur };

  const supabase = await createClient();
  const { error } = await supabase
    .from("versements")
    .update({ date, montant, mode, note: note?.trim() || null })
    .eq("id", id);

  if (error) return { ok: false, erreur: "Modification impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Les versements d'un jour donné — pour Modifier/Supprimer depuis la feuille de jour. */
export async function versementsDuJour(
  contratId: string,
  jour: string
): Promise<
  { id: string; montant: number; mode: string; note: string | null }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("versements")
    .select("id, montant, mode, note")
    .eq("contrat_id", contratId)
    .eq("date", jour)
    .order("cree_le", { ascending: true });
  return (data ?? []).map((v) => ({ ...v, montant: Number(v.montant) }));
}

export async function supprimerVersement(id: string): Promise<ResultatAction> {
  const supabase = await createClient();
  const { error } = await supabase.from("versements").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}
