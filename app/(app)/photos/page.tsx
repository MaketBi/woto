import Link from "next/link";
import { notFound } from "next/navigation";
import { getContratActif, getInspections } from "@/lib/data";
import { ListeInspections } from "@/components/inspection/galerie";

export const metadata = { title: "Photos — Woto" };

export default async function PagePhotos() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const inspections = await getInspections(contrat.vehicule_id);

  return (
    <>
      <h1 className="text-xl font-bold tracking-[-0.3px]">Photos</h1>
      <p className="-mt-1 text-[13px] text-ink-3">
        Contrôles photo du véhicule : 6 angles, kilométrage, état.
      </p>

      <Link
        href="/photos/nouveau"
        className="flex min-h-[58px] items-center justify-center rounded-full bg-ink text-base font-bold text-white"
      >
        Nouveau contrôle
      </Link>

      <div className="mt-0.5 text-sm font-semibold">Contrôles passés</div>
      <ListeInspections inspections={inspections} hrefBase="/photos" />
    </>
  );
}
