import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/database.types";
import type { JourEtat } from "@/lib/libelles";

// Lecture de la page publique /p/[jeton] — AUCUNE session, AUCUNE écriture
// métier. Le jeton est validé d'abord, puis les données sont lues avec la clé
// service_role (qui ne quitte jamais le serveur : `server-only`).

export type DonneesPartage = {
  partage: Tables<"partages">;
  vehicule: Tables<"vehicules">;
  chauffeur: Tables<"chauffeurs"> | null;
  contrat: Tables<"contrats"> | null;
  solde: number;
  joursNonVerses: number;
  /** Somme de tous les versements depuis le début du contrat, tous mois confondus. */
  totalVerse: number;
  mois: JourEtat[];
  attendu: number;
  recu: number;
  depensesMois: number;
  derniersVersements: { date: string; montant: number; mode: string }[];
};

export async function getDonneesPartage(
  jeton: string,
  aujourdhui: string
): Promise<DonneesPartage | null> {
  // Jeton : 12 caractères base64url générés par la base
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(jeton)) return null;

  const admin = createAdminClient();

  const { data: partage } = await admin
    .from("partages")
    .select("*")
    .eq("jeton", jeton)
    .eq("actif", true)
    .maybeSingle();
  if (!partage) return null;

  // Trace du dernier accès — sans bloquer le rendu si ça échoue
  admin
    .from("partages")
    .update({ dernier_acces: new Date().toISOString() })
    .eq("id", partage.id)
    .then(({ error }) => {
      if (error) console.error("dernier_acces:", error.message);
    });

  const [{ data: vehicule }, { data: contrat }] = await Promise.all([
    admin.from("vehicules").select("*").eq("id", partage.vehicule_id).maybeSingle(),
    admin
      .from("contrats")
      .select("*, chauffeurs(*)")
      .eq("vehicule_id", partage.vehicule_id)
      .eq("actif", true)
      .order("cree_le", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!vehicule) return null;

  const contratComplet = contrat as
    | (Tables<"contrats"> & { chauffeurs: Tables<"chauffeurs"> | null })
    | null;

  let solde = 0;
  let mois: JourEtat[] = [];
  let derniersVersements: DonneesPartage["derniersVersements"] = [];
  let depensesMois = 0;
  let totalVerse = 0;

  if (contratComplet) {
    const [annee, numMois] = [
      Number(aujourdhui.slice(0, 4)),
      Number(aujourdhui.slice(5, 7)),
    ];
    const debutMois = `${aujourdhui.slice(0, 7)}-01`;

    const [soldeRes, moisRes, versementsRes, depensesRes, tousVersementsRes] =
      await Promise.all([
        admin.rpc("solde_chauffeur", { p_contrat: contratComplet.id }),
        admin.rpc("etat_du_mois", {
          p_contrat: contratComplet.id,
          p_annee: annee,
          p_mois: numMois,
        }),
        admin
          .from("versements")
          .select("date, montant, mode")
          .eq("contrat_id", contratComplet.id)
          .order("date", { ascending: false })
          .order("cree_le", { ascending: false })
          .limit(5),
        partage.voir_depenses
          ? admin
              .from("depenses")
              .select("montant")
              .eq("vehicule_id", partage.vehicule_id)
              .gte("date", debutMois)
              .lte("date", aujourdhui)
          : Promise.resolve({ data: [] as { montant: number }[] }),
        // Total encaissé depuis le début du contrat, toutes périodes confondues.
        admin
          .from("versements")
          .select("montant")
          .eq("contrat_id", contratComplet.id),
      ]);

    solde = Number(soldeRes.data ?? 0);
    mois = (moisRes.data ?? []).map((j) => ({
      jour: j.jour,
      attendu: Number(j.attendu),
      recu: Number(j.recu),
      etat: j.etat as JourEtat["etat"],
      motif: j.motif,
    }));
    derniersVersements = (versementsRes.data ?? []).map((v) => ({
      date: v.date,
      montant: Number(v.montant),
      mode: v.mode,
    }));
    depensesMois = (depensesRes.data ?? []).reduce(
      (s, d) => s + Number(d.montant),
      0
    );
    totalVerse = (tousVersementsRes.data ?? []).reduce(
      (s, v) => s + Number(v.montant),
      0
    );
  }

  const passes = mois.filter((j) => j.jour <= aujourdhui);

  return {
    partage,
    vehicule,
    chauffeur: contratComplet?.chauffeurs ?? null,
    contrat: contratComplet,
    solde,
    joursNonVerses: passes.filter((j) => j.etat === "non_verse").length,
    totalVerse,
    mois,
    attendu: mois.reduce((s, j) => s + j.attendu, 0),
    recu: mois.reduce((s, j) => s + j.recu, 0),
    depensesMois,
    derniersVersements,
  };
}
