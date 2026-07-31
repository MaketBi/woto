import { getContratActif, getRentabilite, LIBELLES_CATEGORIE } from "@/lib/data";
import { jourISO } from "@/lib/format";

// Export CSV de la rentabilité — séparateur point-virgule + BOM UTF-8
// pour ouvrir proprement dans Excel en locale française.

export async function GET() {
  const contrat = await getContratActif();
  if (!contrat) return new Response("Aucun contrat actif", { status: 404 });

  const moisCourant = jourISO().slice(0, 7);
  const donnees = await getRentabilite(
    contrat.id,
    contrat.vehicule_id,
    moisCourant
  );

  const lignes: string[] = [];
  lignes.push("Mois;Encaisse (F CFA);Depenses (F CFA);Net (F CFA)");
  for (const m of donnees.mois) {
    lignes.push(`${m.mois};${m.encaisse};${m.depenses};${m.encaisse - m.depenses}`);
  }
  lignes.push(
    `Total;${donnees.totalEncaisse};${donnees.totalDepenses};${donnees.totalEncaisse - donnees.totalDepenses}`
  );
  lignes.push("");
  lignes.push("Categorie;Depenses 6 mois (F CFA)");
  for (const [cat, montant] of Object.entries(donnees.parCategorie)) {
    lignes.push(`${LIBELLES_CATEGORIE[cat] ?? cat};${montant}`);
  }

  const csv = "﻿" + lignes.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="woto-rentabilite-${moisCourant}.csv"`,
    },
  });
}
