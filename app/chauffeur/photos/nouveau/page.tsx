import { getContratActif } from "@/lib/data";
import { ParcoursPhotos } from "@/components/inspection/parcours-photos";

export const metadata = { title: "Contrôle photo — Woto" };

export default async function PageNouveauControleChauffeur() {
  const contrat = await getContratActif();
  if (!contrat) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[412px] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold text-ink-2">Aucun contrat actif.</p>
      </main>
    );
  }

  return (
    <ParcoursPhotos
      vehiculeId={contrat.vehicule_id}
      retour="/chauffeur/photos"
    />
  );
}
