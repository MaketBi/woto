import Link from "next/link";
import { notFound } from "next/navigation";
import { getContratActif, getEcheances } from "@/lib/data";
import { jourISO } from "@/lib/format";
import { ListeEcheances } from "./liste-echeances";

export const metadata = { title: "Échéances — Woto" };

export default async function PageEcheances() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  const echeances = await getEcheances(contrat.vehicule_id);

  return (
    <>
      <div className="flex items-center">
        <Link
          href="/reglages"
          className="flex min-h-11 items-center text-[15px] font-semibold text-brand"
        >
          ‹ Réglages
        </Link>
      </div>
      <h1 className="text-xl font-bold tracking-[-0.3px]">Échéances</h1>
      <p className="-mt-1 text-[13px] text-ink-3">
        Assurance, contrôle technique, vidange… Une alerte s&apos;affiche sur
        l&apos;accueil à l&apos;approche de la date.
      </p>

      <ListeEcheances
        echeances={echeances}
        vehiculeId={contrat.vehicule_id}
        aujourdhui={jourISO()}
      />
    </>
  );
}
