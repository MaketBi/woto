import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { getInspection } from "@/lib/data";
import { FicheInspection } from "@/components/inspection/galerie";
import { BoutonSupprimerInspection } from "./supprimer";

export const metadata = { title: "Contrôle — Woto" };

export default async function PageDetailInspection({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inspection = await getInspection(id);
  if (!inspection) notFound();

  const titreBrut = format(parseISO(inspection.date), "EEEE d MMMM yyyy", {
    locale: fr,
  });
  const titre = titreBrut.charAt(0).toUpperCase() + titreBrut.slice(1);

  return (
    <>
      <div className="flex items-center justify-between">
        <Link
          href="/photos"
          className="flex min-h-11 items-center text-[15px] font-semibold text-brand"
        >
          ‹ Photos
        </Link>
        <BoutonSupprimerInspection inspectionId={inspection.id} />
      </div>
      <h1 className="text-xl font-bold tracking-[-0.3px]">{titre}</h1>
      <FicheInspection inspection={inspection} />
    </>
  );
}
