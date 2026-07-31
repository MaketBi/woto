import Link from "next/link";
import { getContratActif, getInspections } from "@/lib/data";
import { ListeInspections } from "@/components/inspection/galerie";

export const metadata = { title: "Photos — Woto" };

export default async function PagePhotosChauffeur() {
  // RLS : le chauffeur ne voit que son contrat actif
  const contrat = await getContratActif();
  if (!contrat) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold text-ink-2">Aucun contrat actif.</p>
      </main>
    );
  }

  const inspections = await getInspections(contrat.vehicule_id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col gap-2.5 px-4 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <Link
          href="/chauffeur"
          className="flex min-h-11 items-center text-[15px] font-semibold text-brand"
        >
          ‹ Mon suivi
        </Link>
      </div>
      <h1 className="text-xl font-bold tracking-[-0.3px]">Photos du véhicule</h1>

      <Link
        href="/chauffeur/photos/nouveau"
        className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand text-base font-semibold text-white"
      >
        Faire le contrôle photo
      </Link>

      <div className="mt-0.5 text-sm font-semibold">Contrôles passés</div>
      <ListeInspections inspections={inspections} hrefBase="/chauffeur/photos" />
    </main>
  );
}
