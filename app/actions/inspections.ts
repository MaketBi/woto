"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Inspections photo du véhicule — utilisées par l'admin ET le chauffeur.
// Les photos arrivent déjà compressées (canvas 1600 px / JPEG 0,8) ; on
// refuse tout fichier anormalement lourd. Chemin : vehicule/inspection/angle.jpg
// La RLS (tables + storage) limite chaque rôle à son périmètre.

// Un fichier "use server" ne peut exporter que des fonctions async :
// cette liste reste interne (le parcours client a la sienne, avec libellés).
const ANGLES = [
  "avant",
  "arriere",
  "gauche",
  "droite",
  "interieur",
  "tableau_bord",
] as const;

const TAILLE_MAX_OCTETS = 1_500_000; // garde-fou serveur (compressé ≈ 400 Ko)

export type ResultatInspection = {
  ok: boolean;
  erreur?: string;
  inspectionId?: string;
};

export async function creerInspection(
  vehiculeId: string
): Promise<ResultatInspection> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée. Reconnecte-toi." };

  // cree_par référence profils : renseigné pour l'admin, null pour le chauffeur
  const { data: profil } = await supabase
    .from("profils")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("inspections")
    .insert({ vehicule_id: vehiculeId, cree_par: profil?.id ?? null })
    .select("id")
    .single();

  if (error || !data) {
    console.error("creerInspection:", error);
    return { ok: false, erreur: "Création impossible. Réessaie." };
  }
  return { ok: true, inspectionId: data.id };
}

export async function ajouterPhoto(
  formData: FormData
): Promise<ResultatInspection> {
  const inspectionId = String(formData.get("inspectionId") ?? "");
  const vehiculeId = String(formData.get("vehiculeId") ?? "");
  const angle = String(formData.get("angle") ?? "");
  const fichier = formData.get("fichier");

  if (!inspectionId || !vehiculeId) return { ok: false, erreur: "Requête invalide." };
  if (!ANGLES.includes(angle as (typeof ANGLES)[number]))
    return { ok: false, erreur: "Angle inconnu." };
  if (!(fichier instanceof Blob) || fichier.size === 0)
    return { ok: false, erreur: "Photo manquante." };
  if (fichier.size > TAILLE_MAX_OCTETS)
    return { ok: false, erreur: "Photo trop lourde après compression. Réessaie." };

  const supabase = await createClient();
  const chemin = `${vehiculeId}/${inspectionId}/${angle}.jpg`;

  const { error: erreurUpload } = await supabase.storage
    .from("photos")
    .upload(chemin, fichier, { upsert: true, contentType: "image/jpeg" });

  if (erreurUpload) {
    console.error("ajouterPhoto upload:", erreurUpload);
    return { ok: false, erreur: "Envoi impossible. Vérifie le réseau." };
  }

  // Une seule ligne par angle : reprendre une photo remplace la précédente
  await supabase
    .from("inspection_photos")
    .delete()
    .eq("inspection_id", inspectionId)
    .eq("angle", angle);

  const { error: erreurInsert } = await supabase
    .from("inspection_photos")
    .insert({
      inspection_id: inspectionId,
      chemin,
      angle,
      ordre: ANGLES.indexOf(angle as (typeof ANGLES)[number]),
    });

  if (erreurInsert) {
    console.error("ajouterPhoto insert:", erreurInsert);
    return { ok: false, erreur: "Enregistrement impossible. Réessaie." };
  }

  return { ok: true };
}

export async function finaliserInspection(params: {
  inspectionId: string;
  km?: number;
  etatGeneral?: number;
  commentaire?: string;
}): Promise<ResultatInspection> {
  const { inspectionId, km, etatGeneral, commentaire } = params;
  if (!inspectionId) return { ok: false, erreur: "Requête invalide." };
  if (km !== undefined && (!Number.isInteger(km) || km < 0))
    return { ok: false, erreur: "Kilométrage invalide." };
  if (
    etatGeneral !== undefined &&
    (!Number.isInteger(etatGeneral) || etatGeneral < 1 || etatGeneral > 5)
  )
    return { ok: false, erreur: "État invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inspections")
    .update({
      km: km ?? null,
      etat_general: etatGeneral ?? null,
      commentaire: commentaire?.trim() || null,
    })
    .eq("id", inspectionId);

  if (error) {
    console.error("finaliserInspection:", error);
    return { ok: false, erreur: "Enregistrement impossible. Réessaie." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Supprime une inspection, ses lignes photos et ses objets Storage (admin). */
export async function supprimerInspection(
  id: string
): Promise<ResultatInspection> {
  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("inspection_photos")
    .select("chemin")
    .eq("inspection_id", id);

  if (photos && photos.length > 0) {
    await supabase.storage.from("photos").remove(photos.map((p) => p.chemin));
  }

  const { error } = await supabase.from("inspections").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression impossible. Réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}
