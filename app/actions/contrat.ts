"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultatAction } from "@/app/actions/versements";

// Édition du contrat, du véhicule et du chauffeur depuis les Réglages.
// Le montant journalier, les jours dus et le solde initial alimentent la
// fonction SQL solde_chauffeur : les modifier recalcule tout l'historique.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function modifierContrat(params: {
  contratId: string;
  montantJournalier: number;
  joursActifs: number[];
  soldeInitial: number;
  dateDebut: string;
}): Promise<ResultatAction> {
  const { montantJournalier, joursActifs, soldeInitial, dateDebut } = params;

  if (!Number.isInteger(montantJournalier) || montantJournalier < 0) {
    return { ok: false, erreur: "Le montant par jour doit être un entier positif." };
  }
  if (joursActifs.length === 0) {
    return { ok: false, erreur: "Sélectionne au moins un jour dû." };
  }
  if (joursActifs.some((j) => !Number.isInteger(j) || j < 1 || j > 7)) {
    return { ok: false, erreur: "Jours dus invalides." };
  }
  if (!Number.isInteger(soldeInitial)) {
    return { ok: false, erreur: "Le solde de départ doit être un entier." };
  }
  if (!DATE_RE.test(dateDebut)) {
    return { ok: false, erreur: "Date de début invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contrats")
    .update({
      montant_journalier: montantJournalier,
      jours_actifs: [...joursActifs].sort((a, b) => a - b),
      solde_initial: soldeInitial,
      date_debut: dateDebut,
    })
    .eq("id", params.contratId);

  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessaie." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function modifierVehicule(params: {
  vehiculeId: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee?: number;
  kmActuel?: number;
}): Promise<ResultatAction> {
  const immatriculation = params.immatriculation.trim();
  if (!immatriculation) {
    return { ok: false, erreur: "L'immatriculation est obligatoire." };
  }
  if (
    params.annee !== undefined &&
    (!Number.isInteger(params.annee) || params.annee < 1950 || params.annee > 2100)
  ) {
    return { ok: false, erreur: "Année invalide." };
  }
  if (
    params.kmActuel !== undefined &&
    (!Number.isInteger(params.kmActuel) || params.kmActuel < 0)
  ) {
    return { ok: false, erreur: "Kilométrage invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicules")
    .update({
      immatriculation,
      marque: params.marque.trim() || null,
      modele: params.modele.trim() || null,
      annee: params.annee ?? null,
      km_actuel: params.kmActuel ?? null,
    })
    .eq("id", params.vehiculeId);

  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessaie." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function modifierChauffeur(params: {
  chauffeurId: string;
  nom: string;
  telephone: string;
}): Promise<ResultatAction> {
  const nom = params.nom.trim();
  if (!nom) return { ok: false, erreur: "Le nom est obligatoire." };

  // Le numéro sert à la connexion par SMS : on le garde tel que saisi, en
  // vérifiant seulement qu'il ne contient que des caractères plausibles.
  const telephone = params.telephone.trim();
  if (telephone && !/^[+0-9 ().-]{6,}$/.test(telephone)) {
    return { ok: false, erreur: "Numéro de téléphone invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("chauffeurs")
    .update({ nom, telephone: telephone || null })
    .eq("id", params.chauffeurId);

  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessaie." };
  revalidatePath("/", "layout");
  return { ok: true };
}
