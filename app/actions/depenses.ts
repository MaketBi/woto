"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultatAction } from "@/app/actions/versements";

// Les quatre catégories du propriétaire — et rien d'autre.
// Carburant, lavage, péages, amendes : à la charge du chauffeur, hors périmètre.
const CATEGORIES = ["entretien", "assurance", "controle_technique", "divers"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function valider(
  date: string,
  montant: number,
  categorie: string
): string | null {
  if (!DATE_RE.test(date)) return "Date invalide.";
  if (!Number.isInteger(montant) || montant <= 0)
    return "Le montant doit être un entier positif.";
  if (!CATEGORIES.includes(categorie)) return "Catégorie inconnue.";
  return null;
}

export async function creerDepense(params: {
  vehiculeId: string;
  date: string;
  categorie: string;
  montant: number;
  fournisseur?: string;
  note?: string;
  km?: number;
}): Promise<ResultatAction> {
  const { vehiculeId, date, categorie, montant, fournisseur, note, km } = params;
  const erreur = valider(date, montant, categorie);
  if (erreur) return { ok: false, erreur };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnecte-toi." };

  const { error } = await supabase.from("depenses").insert({
    vehicule_id: vehiculeId,
    date,
    categorie,
    montant,
    fournisseur: fournisseur?.trim() || null,
    note: note?.trim() || null,
    km: km && Number.isInteger(km) && km > 0 ? km : null,
    saisi_par: user.id,
  });

  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function modifierDepense(params: {
  id: string;
  date: string;
  categorie: string;
  montant: number;
  fournisseur?: string;
  note?: string;
  km?: number;
}): Promise<ResultatAction> {
  const { id, date, categorie, montant, fournisseur, note, km } = params;
  const erreur = valider(date, montant, categorie);
  if (erreur) return { ok: false, erreur };

  const supabase = await createClient();
  const { error } = await supabase
    .from("depenses")
    .update({
      date,
      categorie,
      montant,
      fournisseur: fournisseur?.trim() || null,
      note: note?.trim() || null,
      km: km && Number.isInteger(km) && km > 0 ? km : null,
    })
    .eq("id", id);

  if (error) return { ok: false, erreur: "Modification impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function supprimerDepense(id: string): Promise<ResultatAction> {
  const supabase = await createClient();
  const { error } = await supabase.from("depenses").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}
