import { notFound } from "next/navigation";
import { getContratActif } from "@/lib/data";
import { fcfa } from "@/lib/format";

export const metadata = { title: "Réglages — Woto" };

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function libelleJoursActifs(jours: number[]): string {
  const tries = [...jours].sort((a, b) => a - b);
  // Cas usuel : plage continue (ex. lundi au samedi)
  const continue_ = tries.every((j, i) => i === 0 || j === tries[i - 1] + 1);
  if (continue_ && tries.length > 1) {
    const premier = JOURS[tries[0] - 1];
    const dernier = JOURS[tries[tries.length - 1] - 1];
    const cap = premier.charAt(0).toUpperCase() + premier.slice(1);
    return `${cap} au ${dernier}`;
  }
  return tries.map((j) => JOURS[j - 1]).join(", ");
}

export default async function PageReglages() {
  const contrat = await getContratActif();
  if (!contrat) notFound();

  return (
    <>
      <h1 className="mb-0.5 text-xl font-bold tracking-[-0.3px]">
        Réglages{contrat.chauffeurs ? ` · ${contrat.chauffeurs.nom}` : ""}
      </h1>

      <div className="text-xs font-semibold uppercase tracking-[0.4px] text-ink-3">
        Contrat
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex min-h-11 items-center justify-between border-b border-line-soft px-3.5 py-3">
          <span className="text-sm font-medium text-ink-2">Montant par jour</span>
          <span className="text-[15px] font-semibold tabular-nums">
            {fcfa(contrat.montant_journalier)}
          </span>
        </div>
        <div className="flex min-h-11 items-center justify-between border-b border-line-soft px-3.5 py-3">
          <span className="text-sm font-medium text-ink-2">Jours dus</span>
          <span className="text-[15px] font-semibold">
            {libelleJoursActifs(contrat.jours_actifs)}
          </span>
        </div>
        <div className="flex min-h-11 items-center justify-between px-3.5 py-3">
          <span className="text-sm font-medium text-ink-2">Véhicule</span>
          <span className="text-[15px] font-semibold">
            {contrat.vehicules.immatriculation}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-line-2 bg-surface p-3.5 text-center text-xs leading-snug text-ink-3">
        Lien de consultation, comptes et échéances arrivent dans une prochaine
        version.
      </div>
    </>
  );
}
