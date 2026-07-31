import { notFound } from "next/navigation";
import { getContratActif, getDernierMode, getSolde } from "@/lib/data";
import { jourISO } from "@/lib/format";
import { FormulaireVersement } from "./formulaire-versement";

export const metadata = { title: "Versement — Woto" };

export default async function PageNouveauVersement({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; montant?: string; retour?: string }>;
}) {
  const params = await searchParams;
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const [dernierMode, solde] = await Promise.all([
    getDernierMode(contrat.id),
    getSolde(contrat.id),
  ]);

  const aujourdhui = jourISO();
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : aujourdhui;
  const retour =
    params.retour && params.retour.startsWith("/") ? params.retour : "/";

  return (
    <FormulaireVersement
      contratId={contrat.id}
      montantJournalier={contrat.montant_journalier}
      dernierMode={dernierMode}
      solde={solde}
      dateInitiale={date}
      aujourdhui={aujourdhui}
      deverrouille={params.montant === "libre"}
      retour={retour}
    />
  );
}
