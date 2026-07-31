import { notFound } from "next/navigation";
import { getContratActif } from "@/lib/data";
import { jourISO } from "@/lib/format";
import { FormulaireDepense } from "./formulaire-depense";

export const metadata = { title: "Dépense — Woto" };

export default async function PageNouvelleDepense() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  return (
    <FormulaireDepense
      vehiculeId={contrat.vehicule_id}
      aujourdhui={jourISO()}
    />
  );
}
