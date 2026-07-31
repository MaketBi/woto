import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

// Lectures serveur regroupées. Aucun calcul de solde ici : tout passe
// par les fonctions SQL (solde_chauffeur, etat_du_mois, attendu_par_jour).

export type ContratActif = Tables<"contrats"> & {
  vehicules: Tables<"vehicules">;
  chauffeurs: Tables<"chauffeurs"> | null;
};

/** Le contrat actif (V1 : un seul), avec véhicule et chauffeur. */
export async function getContratActif(): Promise<ContratActif | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contrats")
    .select("*, vehicules(*), chauffeurs(*)")
    .eq("actif", true)
    .order("cree_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ContratActif | null) ?? null;
}

/** Solde du chauffeur — appel de la fonction SQL, jamais recalculé en TS. */
export async function getSolde(contratId: string, au?: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("solde_chauffeur", {
    p_contrat: contratId,
    ...(au ? { p_au: au } : {}),
  });
  if (error) throw new Error(`solde_chauffeur: ${error.message}`);
  return Number(data ?? 0);
}

export type { JourEtat } from "@/lib/libelles";
import { libelleMode, LIBELLES_CATEGORIE } from "@/lib/libelles";
import type { JourEtat } from "@/lib/libelles";

/** L'état de chaque jour d'un mois — alimente le calendrier et la semaine. */
export async function getMois(
  contratId: string,
  annee: number,
  mois: number
): Promise<JourEtat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("etat_du_mois", {
    p_contrat: contratId,
    p_annee: annee,
    p_mois: mois,
  });
  if (error) throw new Error(`etat_du_mois: ${error.message}`);
  return (data ?? []).map((j) => ({
    jour: j.jour,
    attendu: Number(j.attendu),
    recu: Number(j.recu),
    etat: j.etat as JourEtat["etat"],
    motif: j.motif,
  }));
}

/** Mode du dernier versement — présélectionné dans le formulaire. */
export async function getDernierMode(contratId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("versements")
    .select("mode")
    .eq("contrat_id", contratId)
    .order("date", { ascending: false })
    .order("cree_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.mode ?? "wave";
}

export type Mouvement = {
  type: "versement" | "depense";
  id: string;
  date: string;
  montant: number;
  libelle: string;
  partiel: boolean;
};

export { libelleMode, LIBELLES_CATEGORIE };

export type Accueil = {
  contrat: ContratActif;
  solde: number;
  aucunVersement: boolean;
  dernierVersement: { date: string; montant: number } | null;
  joursNonVerses: number;
  joursPartiels: number;
  premierRetard: string | null;
  semaine: JourEtat[]; // les jours actifs de la semaine en cours, lundi en premier
  encaisseMois: number;
  depensesMois: number;
  echeanceProche: Tables<"echeances"> | null;
  mouvements: Mouvement[];
};

/**
 * Toutes les données de l'accueil en un aller-retour serveur.
 * `aujourdhui` au format yyyy-MM-dd (jour métier, heure locale).
 */
export async function getAccueil(aujourdhui: string): Promise<Accueil | null> {
  const contrat = await getContratActif();
  if (!contrat) return null;

  const supabase = await createClient();
  const [annee, mois] = [
    Number(aujourdhui.slice(0, 4)),
    Number(aujourdhui.slice(5, 7)),
  ];
  const debutMois = `${aujourdhui.slice(0, 7)}-01`;

  const [
    solde,
    moisEtat,
    dernier,
    versementsMois,
    depensesMois,
    echeances,
    derniersVersements,
    dernieresDepenses,
  ] = await Promise.all([
    getSolde(contrat.id),
    getMois(contrat.id, annee, mois),
    supabase
      .from("versements")
      .select("date, montant")
      .eq("contrat_id", contrat.id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("versements")
      .select("montant")
      .eq("contrat_id", contrat.id)
      .gte("date", debutMois)
      .lte("date", aujourdhui),
    supabase
      .from("depenses")
      .select("montant")
      .eq("vehicule_id", contrat.vehicule_id)
      .gte("date", debutMois)
      .lte("date", aujourdhui),
    supabase
      .from("echeances")
      .select("*")
      .eq("vehicule_id", contrat.vehicule_id)
      .eq("statut", "a_venir")
      .not("date_echeance", "is", null)
      .gte("date_echeance", aujourdhui)
      .order("date_echeance", { ascending: true }),
    supabase
      .from("versements")
      .select("id, date, montant, mode, cree_le")
      .eq("contrat_id", contrat.id)
      .order("date", { ascending: false })
      .order("cree_le", { ascending: false })
      .limit(5),
    supabase
      .from("depenses")
      .select("id, date, montant, categorie, note, fournisseur, cree_le")
      .eq("vehicule_id", contrat.vehicule_id)
      .order("date", { ascending: false })
      .order("cree_le", { ascending: false })
      .limit(5),
  ]);

  // Jours passés ou courant du mois, non versés / partiels (retard visible).
  const passes = moisEtat.filter((j) => j.jour <= aujourdhui);
  const joursNonVerses = passes.filter((j) => j.etat === "non_verse").length;
  const joursPartiels = passes.filter((j) => j.etat === "partiel").length;
  const premierRetard =
    passes.find((j) => j.etat === "non_verse")?.jour ?? null;

  // Semaine en cours : du lundi au samedi (jours actifs), depuis l'état du mois.
  // La semaine peut chevaucher deux mois : on complète si nécessaire.
  const lundi = lundiDeLaSemaine(aujourdhui);
  const joursSemaine: string[] = Array.from({ length: 6 }, (_, i) =>
    ajouterJours(lundi, i)
  );
  let etatParJour = new Map(moisEtat.map((j) => [j.jour, j]));
  const horsMois = joursSemaine.filter((j) => !etatParJour.has(j));
  if (horsMois.length > 0) {
    const autre = horsMois[0];
    const autreEtat = await getMois(
      contrat.id,
      Number(autre.slice(0, 4)),
      Number(autre.slice(5, 7))
    );
    etatParJour = new Map([
      ...etatParJour,
      ...new Map(autreEtat.map((j) => [j.jour, j] as const)),
    ]);
  }
  const semaine = joursSemaine
    .map((j) => etatParJour.get(j))
    .filter((j): j is JourEtat => Boolean(j));

  const mouvements: Mouvement[] = [
    ...(derniersVersements.data ?? []).map((v) => ({
      type: "versement" as const,
      id: v.id,
      date: v.date,
      montant: Number(v.montant),
      libelle:
        Number(v.montant) < contrat.montant_journalier
          ? `Versement partiel · ${libelleMode(v.mode)}`
          : `Versement · ${libelleMode(v.mode)}`,
      partiel: Number(v.montant) < contrat.montant_journalier,
    })),
    ...(dernieresDepenses.data ?? []).map((d) => ({
      type: "depense" as const,
      id: d.id,
      date: d.date,
      montant: Number(d.montant),
      libelle:
        (LIBELLES_CATEGORIE[d.categorie] ?? d.categorie) +
        (d.note
          ? ` · ${d.note.toLowerCase()}`
          : d.fournisseur
            ? ` · ${d.fournisseur}`
            : ""),
      partiel: false,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5);

  const encaisseMois = (versementsMois.data ?? []).reduce(
    (s, v) => s + Number(v.montant),
    0
  );
  const totalDepensesMois = (depensesMois.data ?? []).reduce(
    (s, d) => s + Number(d.montant),
    0
  );

  return {
    contrat,
    solde,
    aucunVersement: !dernier.data,
    dernierVersement: dernier.data
      ? { date: dernier.data.date, montant: Number(dernier.data.montant) }
      : null,
    joursNonVerses,
    joursPartiels,
    premierRetard,
    semaine,
    encaisseMois,
    depensesMois: totalDepensesMois,
    // L'alerte respecte le rappel_jours propre à chaque échéance
    echeanceProche:
      (echeances.data ?? []).find(
        (e) =>
          e.date_echeance !== null &&
          e.date_echeance <= ajouterJours(aujourdhui, e.rappel_jours)
      ) ?? null,
    mouvements,
  };
}

export type DepensesEcran = {
  totalMois: number;
  nbMois: number;
  moyenne6Mois: number;
  parCategorie: Record<string, number>;
  liste: Tables<"depenses">[];
  moisPrecedentVide: boolean;
};

/** Données de l'écran Dépenses pour un mois donné (yyyy-MM). */
export async function getDepensesMois(
  vehiculeId: string,
  moisISO: string
): Promise<DepensesEcran> {
  const supabase = await createClient();
  const debut = `${moisISO}-01`;
  const finExclue = moisSuivant(moisISO) + "-01";
  const debutPrecedent = moisPrecedent(moisISO) + "-01";
  const debut6Mois = ajouterMois(moisISO, -5) + "-01";

  const [duMois, sixMois] = await Promise.all([
    supabase
      .from("depenses")
      .select("*")
      .eq("vehicule_id", vehiculeId)
      .gte("date", debut)
      .lt("date", finExclue)
      .order("date", { ascending: false })
      .order("cree_le", { ascending: false }),
    supabase
      .from("depenses")
      .select("date, montant")
      .eq("vehicule_id", vehiculeId)
      .gte("date", debut6Mois)
      .lt("date", finExclue),
  ]);

  const liste = (duMois.data ?? []) as Tables<"depenses">[];
  const totalMois = liste.reduce((s, d) => s + Number(d.montant), 0);
  const parCategorie: Record<string, number> = {
    entretien: 0,
    assurance: 0,
    controle_technique: 0,
    divers: 0,
  };
  for (const d of liste) {
    parCategorie[d.categorie] = (parCategorie[d.categorie] ?? 0) + Number(d.montant);
  }
  const total6 = (sixMois.data ?? []).reduce((s, d) => s + Number(d.montant), 0);
  const moisPrecedentVide = !(sixMois.data ?? []).some(
    (d) => d.date >= debutPrecedent && d.date < debut
  );

  return {
    totalMois,
    nbMois: liste.length,
    moyenne6Mois: Math.round(total6 / 6),
    parCategorie,
    liste,
    moisPrecedentVide,
  };
}

/** Toutes les échéances du véhicule — à venir d'abord (par date), puis faites. */
export async function getEcheances(
  vehiculeId: string
): Promise<Tables<"echeances">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("echeances")
    .select("*")
    .eq("vehicule_id", vehiculeId);
  return (data ?? []).sort((a, b) => {
    if (a.statut !== b.statut) return a.statut === "fait" ? 1 : -1;
    return (a.date_echeance ?? "9999") < (b.date_echeance ?? "9999") ? -1 : 1;
  });
}

export type MoisRentabilite = {
  mois: string; // yyyy-MM
  encaisse: number;
  depenses: number;
};

export type Rentabilite = {
  mois: MoisRentabilite[]; // 6 mois, du plus ancien au plus récent
  totalEncaisse: number;
  totalDepenses: number;
  parCategorie: Record<string, number>; // sur les 6 mois
};

/** Encaissé vs dépenses sur les 6 derniers mois (mois courant inclus). */
export async function getRentabilite(
  contratId: string,
  vehiculeId: string,
  moisCourant: string
): Promise<Rentabilite> {
  const supabase = await createClient();
  const moisListe = Array.from({ length: 6 }, (_, i) =>
    ajouterMois(moisCourant, i - 5)
  );
  const debut = `${moisListe[0]}-01`;
  const finExclue = `${moisSuivant(moisCourant)}-01`;

  const [versements, depenses] = await Promise.all([
    supabase
      .from("versements")
      .select("date, montant")
      .eq("contrat_id", contratId)
      .gte("date", debut)
      .lt("date", finExclue),
    supabase
      .from("depenses")
      .select("date, montant, categorie")
      .eq("vehicule_id", vehiculeId)
      .gte("date", debut)
      .lt("date", finExclue),
  ]);

  const parMois = new Map<string, MoisRentabilite>(
    moisListe.map((m) => [m, { mois: m, encaisse: 0, depenses: 0 }])
  );
  for (const v of versements.data ?? []) {
    const m = parMois.get(v.date.slice(0, 7));
    if (m) m.encaisse += Number(v.montant);
  }
  const parCategorie: Record<string, number> = {};
  for (const d of depenses.data ?? []) {
    const m = parMois.get(d.date.slice(0, 7));
    if (m) m.depenses += Number(d.montant);
    parCategorie[d.categorie] = (parCategorie[d.categorie] ?? 0) + Number(d.montant);
  }

  const mois = moisListe.map((m) => parMois.get(m)!);
  return {
    mois,
    totalEncaisse: mois.reduce((s, m) => s + m.encaisse, 0),
    totalDepenses: mois.reduce((s, m) => s + m.depenses, 0),
    parCategorie,
  };
}

/** Historique unifié versements + dépenses, du plus récent au plus ancien. */
export async function getHistorique(
  contratId: string,
  vehiculeId: string,
  montantJournalier: number
): Promise<Mouvement[]> {
  const supabase = await createClient();
  const [versements, depenses] = await Promise.all([
    supabase
      .from("versements")
      .select("id, date, montant, mode, cree_le")
      .eq("contrat_id", contratId)
      .order("date", { ascending: false })
      .order("cree_le", { ascending: false })
      .limit(300),
    supabase
      .from("depenses")
      .select("id, date, montant, categorie, note, fournisseur, cree_le")
      .eq("vehicule_id", vehiculeId)
      .order("date", { ascending: false })
      .order("cree_le", { ascending: false })
      .limit(300),
  ]);

  return [
    ...(versements.data ?? []).map((v) => ({
      type: "versement" as const,
      id: v.id,
      date: v.date,
      montant: Number(v.montant),
      libelle:
        Number(v.montant) < montantJournalier
          ? `Versement partiel · ${libelleMode(v.mode)}`
          : `Versement · ${libelleMode(v.mode)}`,
      partiel: Number(v.montant) < montantJournalier,
    })),
    ...(depenses.data ?? []).map((d) => ({
      type: "depense" as const,
      id: d.id,
      date: d.date,
      montant: Number(d.montant),
      libelle:
        (LIBELLES_CATEGORIE[d.categorie] ?? d.categorie) +
        (d.note
          ? ` · ${d.note.toLowerCase()}`
          : d.fournisseur
            ? ` · ${d.fournisseur}`
            : ""),
      partiel: false,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export type InspectionResume = Tables<"inspections"> & { nbPhotos: number };

/** Les inspections d'un véhicule, plus récentes d'abord. */
export async function getInspections(
  vehiculeId: string
): Promise<InspectionResume[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inspections")
    .select("*, inspection_photos(id)")
    .eq("vehicule_id", vehiculeId)
    .order("date", { ascending: false })
    .order("cree_le", { ascending: false });

  return (data ?? []).map((i) => {
    const { inspection_photos, ...inspection } = i as Tables<"inspections"> & {
      inspection_photos: { id: string }[];
    };
    return { ...inspection, nbPhotos: inspection_photos.length };
  });
}

export type PhotoSignee = {
  angle: string;
  chemin: string;
  url: string | null;
};

export type InspectionDetail = Tables<"inspections"> & {
  photos: PhotoSignee[];
};

/** Une inspection et ses photos en URLs signées (1 h). */
export async function getInspection(
  id: string
): Promise<InspectionDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inspections")
    .select("*, inspection_photos(angle, chemin, ordre)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const { inspection_photos, ...inspection } = data as Tables<"inspections"> & {
    inspection_photos: { angle: string; chemin: string; ordre: number }[];
  };
  const lignes = [...inspection_photos].sort((a, b) => a.ordre - b.ordre);

  let urls: (string | null)[] = lignes.map(() => null);
  if (lignes.length > 0) {
    const { data: signees } = await supabase.storage
      .from("photos")
      .createSignedUrls(
        lignes.map((p) => p.chemin),
        3600
      );
    if (signees) urls = signees.map((s) => s.signedUrl ?? null);
  }

  return {
    ...inspection,
    photos: lignes.map((p, i) => ({
      angle: p.angle,
      chemin: p.chemin,
      url: urls[i],
    })),
  };
}

// ---- Petits helpers de dates métier (chaînes yyyy-MM-dd, heure locale) ----

export function ajouterJours(jour: string, n: number): string {
  const d = new Date(`${jour}T00:00:00`);
  d.setDate(d.getDate() + n);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function lundiDeLaSemaine(jour: string): string {
  const d = new Date(`${jour}T00:00:00`);
  const isodow = d.getDay() === 0 ? 7 : d.getDay(); // 1 = lundi … 7 = dimanche
  return ajouterJours(jour, 1 - isodow);
}

export function moisSuivant(moisISO: string): string {
  return ajouterMois(moisISO, 1);
}

export function moisPrecedent(moisISO: string): string {
  return ajouterMois(moisISO, -1);
}

export function ajouterMois(moisISO: string, n: number): string {
  const [a, m] = moisISO.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  const annee = Math.floor(total / 12);
  const mois = (total % 12) + 1;
  return `${annee}-${String(mois).padStart(2, "0")}`;
}
