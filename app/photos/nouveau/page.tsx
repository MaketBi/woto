import { notFound } from "next/navigation";
import { getContratActif } from "@/lib/data";
import { ParcoursPhotos } from "@/components/inspection/parcours-photos";

export const metadata = { title: "Contrôle photo — Woto" };

export default async function PageNouveauControle() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  return <ParcoursPhotos vehiculeId={contrat.vehicule_id} retour="/photos" />;
}
